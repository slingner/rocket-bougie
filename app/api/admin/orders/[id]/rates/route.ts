import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getRates } from '@/lib/shippo'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) return null
  return createAdminClient()
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminClient = await requireAdmin()
  if (!adminClient) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = await adminClient

  // Fetch order + items → variants → shipping profiles (include name for display)
  const { data: order } = await supabase
    .from('orders')
    .select(`
      shipping_name, shipping_address1, shipping_address2,
      shipping_city, shipping_state, shipping_zip, shipping_country,
      order_items (
        title, quantity,
        product_variants (
          shipping_profile_id,
          shipping_profiles ( name, pounds, length_in, width_in, height_in )
        )
      )
    `)
    .eq('id', id)
    .single()

  if (!order) return Response.json({ error: 'Order not found' }, { status: 404 })
  if (!order.shipping_address1) return Response.json({ error: 'Order has no shipping address' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (order.order_items ?? []) as any[]

  // Build per-item profile breakdown for display
  const itemBreakdown: Array<{ title: string; quantity: number; profileName: string | null; pounds: number }> = []

  let totalPounds = 0
  let maxProfile: { name: string; pounds: number; length_in: number; width_in: number; height_in: number } | null = null
  let anyUnassigned = false

  for (const item of items) {
    const profile = item.product_variants?.shipping_profiles
    if (profile && profile.pounds) {
      const lbs = Number(profile.pounds)
      totalPounds += lbs * item.quantity
      if (!maxProfile || lbs > maxProfile.pounds) {
        maxProfile = {
          name: profile.name,
          pounds: lbs,
          length_in: Number(profile.length_in ?? 0),
          width_in: Number(profile.width_in ?? 0),
          height_in: Number(profile.height_in ?? 0),
        }
      }
      itemBreakdown.push({ title: item.title, quantity: item.quantity, profileName: profile.name, pounds: lbs })
    } else {
      anyUnassigned = true
      itemBreakdown.push({ title: item.title, quantity: item.quantity, profileName: null, pounds: 0 })
    }
  }

  // Fallback if no profiles assigned
  const usingFallback = !maxProfile || totalPounds === 0
  if (usingFallback) {
    maxProfile = { name: 'Fallback', pounds: 0.5, length_in: 12, width_in: 9, height_in: 0.5 }
    totalPounds = 0.5
  }

  const parcel = {
    profileName: usingFallback ? null : maxProfile!.name,
    totalPounds,
    lengthIn: maxProfile!.length_in,
    widthIn: maxProfile!.width_in,
    heightIn: maxProfile!.height_in,
    usingFallback,
    anyUnassigned,
    items: itemBreakdown,
  }

  try {
    const rates = await getRates({
      toName: order.shipping_name ?? 'Customer',
      toStreet1: order.shipping_address1,
      toStreet2: order.shipping_address2,
      toCity: order.shipping_city ?? '',
      toState: order.shipping_state ?? '',
      toZip: order.shipping_zip ?? '',
      toCountry: order.shipping_country ?? 'US',
      weightLb: totalPounds,
      lengthIn: maxProfile!.length_in,
      widthIn: maxProfile!.width_in,
      heightIn: maxProfile!.height_in,
    })

    const sorted = [...rates].sort((a, b) => Number(a.amount) - Number(b.amount))
    return Response.json({ rates: sorted, parcel })
  } catch (err) {
    console.error('Shippo rates error:', err)
    return Response.json({ error: err instanceof Error ? err.message : 'Failed to get rates' }, { status: 500 })
  }
}
