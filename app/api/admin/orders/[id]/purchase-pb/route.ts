import { createClient, createAdminClient } from '@/lib/supabase/server'
import { purchasePBLabel } from '@/lib/pitney-bowes'

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
  const body = await req.json()
  const { carrier, serviceId, parcelType, carrierAccount } = body as {
    carrier: string
    serviceId: string
    parcelType: string
    carrierAccount: string
  }

  if (!carrier || !serviceId || !parcelType) {
    return Response.json({ error: 'carrier, serviceId, and parcelType are required' }, { status: 400 })
  }

  const supabase = await adminClient

  // Fetch order + shipping address + items → variants → shipping profiles
  const { data: order } = await supabase
    .from('orders')
    .select(`
      shipping_name, shipping_address1, shipping_address2,
      shipping_city, shipping_state, shipping_zip, shipping_country,
      order_items (
        quantity,
        product_variants (
          shipping_profiles ( pounds, length_in, width_in, height_in )
        )
      )
    `)
    .eq('id', id)
    .single()

  if (!order) return Response.json({ error: 'Order not found' }, { status: 404 })
  if (!order.shipping_address1) return Response.json({ error: 'Order has no shipping address' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (order.order_items ?? []) as any[]

  let totalPounds = 0
  let maxProfile: { pounds: number; length_in: number; width_in: number; height_in: number } | null = null

  for (const item of items) {
    const profile = item.product_variants?.shipping_profiles
    if (profile && profile.pounds) {
      const lbs = Number(profile.pounds)
      totalPounds += lbs * item.quantity
      if (!maxProfile || lbs > maxProfile.pounds) {
        maxProfile = {
          pounds: lbs,
          length_in: Number(profile.length_in ?? 0),
          width_in: Number(profile.width_in ?? 0),
          height_in: Number(profile.height_in ?? 0),
        }
      }
    }
  }

  // Fallback if no profiles assigned
  if (!maxProfile || totalPounds === 0) {
    maxProfile = { pounds: 0.5, length_in: 12, width_in: 9, height_in: 0.5 }
    totalPounds = 0.5
  }

  try {
    const transaction = await purchasePBLabel({
      fromName: process.env.SHIPPO_FROM_NAME ?? 'Rocket Boogie Co.',
      fromStreet1: process.env.SHIPPO_FROM_STREET1!,
      fromCity: process.env.SHIPPO_FROM_CITY!,
      fromState: process.env.SHIPPO_FROM_STATE!,
      fromZip: process.env.SHIPPO_FROM_ZIP!,
      fromPhone: process.env.SHIPPO_FROM_PHONE ?? '',
      toName: order.shipping_name ?? 'Customer',
      toStreet1: order.shipping_address1,
      toStreet2: order.shipping_address2,
      toCity: order.shipping_city ?? '',
      toState: order.shipping_state ?? '',
      toZip: order.shipping_zip ?? '',
      toCountry: order.shipping_country ?? 'US',
      weightLb: totalPounds,
      lengthIn: maxProfile.length_in,
      widthIn: maxProfile.width_in,
      heightIn: maxProfile.height_in,
      carrier,
      serviceId,
      parcelType,
      carrierAccount: carrierAccount ?? '',
    })

    await supabase
      .from('orders')
      .update({
        tracking_number: transaction.trackingNumber,
        tracking_url: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${transaction.trackingNumber}`,
        label_url: transaction.labelUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    return Response.json({
      trackingNumber: transaction.trackingNumber,
      labelUrl: transaction.labelUrl,
    })
  } catch (err) {
    console.error('Pitney Bowes purchase error:', err)
    return Response.json({ error: err instanceof Error ? err.message : 'Purchase failed' }, { status: 500 })
  }
}
