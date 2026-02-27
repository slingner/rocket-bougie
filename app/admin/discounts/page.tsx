import { createAdminClient } from '@/lib/supabase/server'
import DiscountsManager from './DiscountsManager'

export const metadata = { title: 'Discounts — Admin' }

export default async function DiscountsPage() {
  const supabase = await createAdminClient()

  const { data: codes } = await supabase
    .from('discount_codes')
    .select('*')
    .order('created_at', { ascending: false })

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
        Codes are applied at checkout and synced to Stripe automatically.
      </p>

      <DiscountsManager codes={codes ?? []} />
    </div>
  )
}
