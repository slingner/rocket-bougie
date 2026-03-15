import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getRates } from '@/lib/shippo'
import { getPBRates } from '@/lib/pitney-bowes'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) return null
  return createAdminClient()
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminClient = await requireAdmin()
  if (!adminClient) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const carrier: 'pb' | 'shippo' | 'both' = body.carrier ?? 'both'
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
          shipping_profiles ( name, pounds, length_in, width_in, height_in, parcel_type )
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
  let maxProfile: { name: string; pounds: number; length_in: number; width_in: number; height_in: number; parcel_type: string } | null = null
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
          parcel_type: profile.parcel_type ?? 'LGENV',
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
    maxProfile = { name: 'Fallback', pounds: 0.5, length_in: 12, width_in: 9, height_in: 0.5, parcel_type: 'LGENV' }
    totalPounds = 0.5
  }

  const parcel = {
    profileName: usingFallback ? null : maxProfile!.name,
    parcelType: usingFallback ? 'LGENV' : maxProfile!.parcel_type,
    totalPounds,
    lengthIn: maxProfile!.length_in,
    widthIn: maxProfile!.width_in,
    heightIn: maxProfile!.height_in,
    usingFallback,
    anyUnassigned,
    items: itemBreakdown,
  }

  const fromZip = process.env.SHIPPO_FROM_ZIP ?? ''

  const runShippo = carrier === 'shippo' || carrier === 'both'
  const runPB = carrier === 'pb' || carrier === 'both'

  const [shippoResult, pbResult] = await Promise.allSettled([
    runShippo ? getRates({
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
    }) : Promise.resolve([]),
    runPB ? getPBRates({
      fromZip,
      toZip: order.shipping_zip ?? '',
      toCountry: order.shipping_country ?? 'US',
      weightLb: totalPounds,
      lengthIn: maxProfile!.length_in,
      widthIn: maxProfile!.width_in,
      heightIn: maxProfile!.height_in,
      parcelType: usingFallback ? 'LGENV' : maxProfile!.parcel_type,
    }) : Promise.resolve([]),
  ])

  if (shippoResult.status === 'rejected' && pbResult.status === 'rejected') {
    console.error('Shippo error:', shippoResult.reason)
    console.error('Pitney Bowes error:', pbResult.reason)
    return Response.json({ error: 'Failed to get rates from both carriers' }, { status: 500 })
  }

  const shippoRates = shippoResult.status === 'fulfilled'
    ? [...shippoResult.value].sort((a, b) => Number(a.amount) - Number(b.amount))
    : []
  const pbRates = pbResult.status === 'fulfilled' ? pbResult.value : []

  const shippoError = (runShippo && shippoResult.status === 'rejected')
    ? (shippoResult.reason instanceof Error ? shippoResult.reason.message : 'Shippo unavailable')
    : null
  const pbError = (runPB && pbResult.status === 'rejected')
    ? (pbResult.reason instanceof Error ? pbResult.reason.message : 'Pitney Bowes unavailable')
    : null

  if (shippoResult.status === 'rejected') console.error('Shippo rates error:', shippoResult.reason)
  if (pbResult.status === 'rejected') console.error('Pitney Bowes rates error:', pbResult.reason)

  return Response.json({ shippoRates, pbRates, parcel, shippoError, pbError })
}
