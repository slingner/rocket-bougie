import { createAdminClient } from '@/lib/supabase/server'
import TestimonialsGrid from './TestimonialsGrid'

type Review = {
  id: string
  customer_name: string
  rating: number
  body: string
}

export default async function Testimonials() {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('reviews')
    .select('id, customer_name, rating, body')
    .eq('status', 'approved')
    .not('body', 'is', null)
    .neq('body', '')
    .order('created_at', { ascending: false })

  const reviews = (data ?? []) as Review[]
  if (reviews.length === 0) return null

  return (
    <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 1.5rem' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <p
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              opacity: 0.4,
              margin: '0 0 0.875rem',
            }}
          >
            From our customers
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            What people are saying
          </h2>
        </div>

        <TestimonialsGrid reviews={reviews} />
      </div>
    </section>
  )
}
