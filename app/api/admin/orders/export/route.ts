import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) return null
  return createAdminClient()
}

function csvRow(fields: (string | number | null | undefined)[]): string {
  return fields
    .map(f => {
      const val = f == null ? '' : String(f)
      // Wrap in quotes if contains comma, newline, or quote
      if (val.includes(',') || val.includes('\n') || val.includes('"')) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return val
    })
    .join(',')
}

export async function GET(req: Request) {
  const adminClient = await requireAdmin()
  if (!adminClient) return new Response('Unauthorized', { status: 401 })

  const supabase = await adminClient
  const url = new URL(req.url)
  const ids = url.searchParams.get('ids')?.split(',').filter(Boolean) ?? []

  if (ids.length === 0) return new Response('No order IDs provided', { status: 400 })

  // Fetch orders with items → variants → shipping profiles
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id, order_number, email,
      shipping_name, shipping_address1, shipping_address2,
      shipping_city, shipping_state, shipping_zip, shipping_country,
      order_items (
        title, variant_title, quantity,
        product_variants (
          shipping_profile_id,
          shipping_profiles ( pounds, length_in, width_in, height_in )
        )
      )
    `)
    .in('id', ids)
    .order('order_number')

  if (error || !orders) return new Response('Failed to fetch orders', { status: 500 })

  const header = csvRow([
    'Email', 'Name', 'Company', 'Address', 'Address Line 2',
    'City', 'State', 'Zipcode', 'Country',
    'Order ID', 'Order Items', 'Pounds', 'Length', 'Width', 'Height',
  ])

  const rows = orders.map(order => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (order.order_items ?? []) as any[]

    // Build item description string
    const itemDesc = items
      .map(i => {
        const label = i.variant_title ? `${i.title} (${i.variant_title})` : i.title
        return i.quantity > 1 ? `${label} ×${i.quantity}` : label
      })
      .join(', ')

    // Sum total weight; use largest profile's dimensions for the package
    let totalPounds = 0
    let maxProfile: { pounds: number; length_in: number; width_in: number; height_in: number } | null = null

    for (const item of items) {
      const profile = item.product_variants?.shipping_profiles
      if (profile) {
        const lbs = Number(profile.pounds ?? 0)
        totalPounds += lbs * item.quantity
        if (!maxProfile || lbs > maxProfile.pounds) {
          maxProfile = {
            pounds: Number(profile.pounds ?? 0),
            length_in: Number(profile.length_in ?? 0),
            width_in: Number(profile.width_in ?? 0),
            height_in: Number(profile.height_in ?? 0),
          }
        }
      }
    }

    return csvRow([
      order.email,
      order.shipping_name,
      '', // Company — not collected
      order.shipping_address1,
      order.shipping_address2,
      order.shipping_city,
      order.shipping_state,
      order.shipping_zip,
      order.shipping_country ?? 'US',
      order.order_number,
      itemDesc,
      totalPounds > 0 ? totalPounds.toFixed(2) : '',
      maxProfile?.length_in ?? '',
      maxProfile?.width_in ?? '',
      maxProfile?.height_in ?? '',
    ])
  })

  const csv = [header, ...rows].join('\r\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="pirateship-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
