import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import StarRating from '@/components/StarRating'

export const metadata = { title: 'Reviews | Admin' }

async function setReviewStatus(id: string, status: 'approved' | 'rejected') {
  'use server'
  const supabase = createAdminClient()
  await supabase.from('reviews').update({ status }).eq('id', id)
  revalidatePath('/admin/reviews')
}

export default async function ReviewsPage() {
  const supabase = createAdminClient()

  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      id,
      rating,
      body,
      customer_name,
      status,
      token_used,
      created_at,
      products ( title, handle )
    `)
    .order('created_at', { ascending: false })

  const pending = (reviews ?? []).filter(r => r.status === 'pending' && r.token_used)
  const approved = (reviews ?? []).filter(r => r.status === 'approved')
  const rejected = (reviews ?? []).filter(r => r.status === 'rejected')

  return (
    <div style={{ maxWidth: 800 }}>
      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.75rem',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          margin: '0 0 2rem',
        }}
      >
        Reviews
      </h1>

      {/* Pending */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={sectionHeading}>
          Pending
          {pending.length > 0 && (
            <span style={{
              marginLeft: '0.5rem',
              background: '#ffaaaa',
              color: '#1a1a1a',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.15rem 0.5rem',
              borderRadius: '100px',
            }}>
              {pending.length}
            </span>
          )}
        </h2>

        {pending.length === 0 ? (
          <p style={{ fontSize: '0.875rem', opacity: 0.4, margin: 0 }}>No pending reviews.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pending.map(r => (
              <ReviewCard key={r.id} review={r} showActions onApprove={setReviewStatus.bind(null, r.id, 'approved')} onReject={setReviewStatus.bind(null, r.id, 'rejected')} />
            ))}
          </div>
        )}
      </section>

      {/* Approved */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={sectionHeading}>Approved ({approved.length})</h2>
        {approved.length === 0 ? (
          <p style={{ fontSize: '0.875rem', opacity: 0.4, margin: 0 }}>No approved reviews yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {approved.map(r => (
              <ReviewCard key={r.id} review={r} onReject={setReviewStatus.bind(null, r.id, 'rejected')} />
            ))}
          </div>
        )}
      </section>

      {/* Rejected */}
      {rejected.length > 0 && (
        <section>
          <h2 style={sectionHeading}>Rejected ({rejected.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {rejected.map(r => (
              <ReviewCard key={r.id} review={r} onApprove={setReviewStatus.bind(null, r.id, 'approved')} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function ReviewCard({
  review,
  showActions,
  onApprove,
  onReject,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  review: any
  showActions?: boolean
  onApprove?: () => Promise<void>
  onReject?: () => Promise<void>
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const product = review.products as any
  const date = new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div style={{
      background: 'var(--muted)',
      borderRadius: '0.875rem',
      padding: '1.25rem 1.5rem',
      display: 'flex',
      gap: '1.25rem',
      alignItems: 'flex-start',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
          {review.rating && <StarRating rating={review.rating} size="sm" />}
          <span style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.7 }}>{review.customer_name}</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.35 }}>·</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.45 }}>{product?.title}</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.35 }}>·</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.35 }}>{date}</span>
        </div>
        {review.body && (
          <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.65, opacity: 0.75 }}>{review.body}</p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
        {onApprove && (
          <form action={onApprove}>
            <button
              type="submit"
              style={{
                background: '#dcfce7',
                border: '1px solid #bbf7d0',
                color: '#166534',
                borderRadius: '0.5rem',
                padding: '0.4rem 0.875rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Approve
            </button>
          </form>
        )}
        {onReject && (
          <form action={onReject}>
            <button
              type="submit"
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
                borderRadius: '0.5rem',
                padding: '0.4rem 0.875rem',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer',
                opacity: 0.45,
                fontFamily: 'inherit',
              }}
            >
              Reject
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

const sectionHeading: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  opacity: 0.45,
  margin: '0 0 0.875rem',
  display: 'flex',
  alignItems: 'center',
}
