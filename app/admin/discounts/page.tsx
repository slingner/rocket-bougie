import { createAdminClient } from '@/lib/supabase/server'
import DiscountsManager from './DiscountsManager'

export const metadata = { title: 'Discounts — Admin' }

export default async function DiscountsPage() {
  const supabase = await createAdminClient()

  const [{ data: codes }, { data: rules }] = await Promise.all([
    supabase.from('discount_codes').select('*').order('created_at', { ascending: false }),
    supabase.from('discount_rules').select('*').order('sort_order'),
  ])

  return (
    <div style={{ maxWidth: 760 }}>
      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.75rem',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          margin: '0 0 0.375rem',
        }}
      >
        Discounts
      </h1>
      <p style={{ fontSize: '0.875rem', opacity: 0.5, margin: '0 0 1.75rem' }}>
        Manage automatic volume deals and promo codes.
      </p>

      <DiscountsManager codes={codes ?? []} rules={rules ?? []} />
    </div>
  )
}
