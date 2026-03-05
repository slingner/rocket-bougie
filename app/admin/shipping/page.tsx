import { createAdminClient } from '@/lib/supabase/server'
import ShippingManager from './ShippingManager'

export const metadata = { title: 'Shipping | Admin' }

export default async function ShippingPage() {
  const supabase = await createAdminClient()

  const [{ data: profiles }, { data: variants }] = await Promise.all([
    supabase.from('shipping_profiles').select('*').order('sort_order'),
    supabase
      .from('product_variants')
      .select(`
        id, option1_name, option1_value, option2_name, option2_value, price,
        shipping_profile_id,
        products!inner(id, title, product_type, published)
      `)
      .order('title', { referencedTable: 'products' }),
  ])

  return (
    <div style={{ maxWidth: 860 }}>
      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.75rem',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          margin: '0 0 0.375rem',
        }}
      >
        Shipping
      </h1>
      <p style={{ fontSize: '0.875rem', opacity: 0.5, margin: '0 0 1.75rem' }}>
        Define shipping rate profiles and assign them to products.
      </p>

      <ShippingManager
        initialProfiles={profiles ?? []}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialVariants={(variants ?? []) as any}
      />
    </div>
  )
}
