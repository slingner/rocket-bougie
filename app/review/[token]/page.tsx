import { notFound } from 'next/navigation'
import Nav from '@/components/Nav'
import { createAdminClient } from '@/lib/supabase/server'
import ReviewForm from './ReviewForm'

export const metadata = { title: 'Leave a Review | Rocket Boogie Co.' }

export default async function ReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()

  const { data: review } = await supabase
    .from('reviews')
    .select(`
      id,
      token_used,
      customer_name,
      product_id,
      products (
        title,
        product_images ( url, position )
      )
    `)
    .eq('review_token', token)
    .single()

  if (!review) notFound()

  if (review.token_used) {
    return (
      <>
        <Nav />
        <main style={{ maxWidth: 560, margin: '0 auto', padding: '5rem 1.5rem', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 400, margin: '0 0 1rem' }}>
            This link has expired
          </h1>
          <p style={{ opacity: 0.55, lineHeight: 1.7, margin: 0 }}>
            It looks like you&apos;ve already submitted a review using this link. Thank you!
          </p>
        </main>
      </>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const product = review.products as any
  const images: { url: string; position: number }[] = product?.product_images ?? []
  const firstImage = [...images].sort((a, b) => a.position - b.position)[0]?.url ?? null

  return (
    <>
      <Nav />
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>

        {/* Product context */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
          {firstImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={firstImage}
              alt={product?.title ?? ''}
              style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: '0.625rem', flexShrink: 0, background: 'var(--border)' }}
            />
          )}
          <div>
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.4 }}>
              Reviewing
            </p>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 400, letterSpacing: '-0.02em', margin: 0 }}>
              {product?.title ?? 'Your purchase'}
            </h1>
          </div>
        </div>

        <ReviewForm token={token} defaultName={review.customer_name ?? ''} />
      </main>
    </>
  )
}
