import { createAdminClient } from '@/lib/supabase/server'

export const metadata = { title: 'Subscriptions | Admin' }

export default async function SubscriptionsPage() {
  const supabase = await createAdminClient()
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false })

  const rows = subscriptions ?? []
  const activeCount = rows.filter(s => s.status === 'active').length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1.75rem' }}>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.75rem',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          Sticker Club
        </h1>
        <span style={{ fontSize: '0.9rem', opacity: 0.4 }}>
          {activeCount} active subscriber{activeCount !== 1 ? 's' : ''}
        </span>
      </div>

      {rows.length === 0 ? (
        <div style={{ background: 'var(--muted)', borderRadius: '0.75rem', padding: '3rem', textAlign: 'center', opacity: 0.6 }}>
          No subscribers yet.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Email', 'Name', 'Status', 'Next billing', 'Subscribed'].map(h => (
                  <th
                    key={h}
                    style={{
                      padding: '0.625rem 0.875rem',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      opacity: 0.5,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(sub => (
                <tr key={sub.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-[var(--muted)] transition-colors">
                  <td style={{ padding: '0.75rem 0.875rem' }}>{sub.email}</td>
                  <td style={{ padding: '0.75rem 0.875rem', opacity: 0.65 }}>{sub.name ?? '—'}</td>
                  <td style={{ padding: '0.75rem 0.875rem' }}>
                    <StatusBadge status={sub.status} />
                  </td>
                  <td style={{ padding: '0.75rem 0.875rem', opacity: 0.65 }}>
                    {sub.current_period_end
                      ? new Date(sub.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </td>
                  <td style={{ padding: '0.75rem 0.875rem', opacity: 0.65 }}>
                    {new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    active: { bg: '#dcfce7', color: '#166534' },
    past_due: { bg: '#fef9c3', color: '#854d0e' },
    canceled: { bg: 'var(--border)', color: 'var(--foreground)' },
    unpaid: { bg: '#fee2e2', color: '#991b1b' },
  }
  const s = styles[status] ?? { bg: 'var(--border)', color: 'var(--foreground)' }

  return (
    <span style={{
      fontSize: '0.72rem',
      fontWeight: 600,
      padding: '0.2rem 0.65rem',
      borderRadius: '100px',
      background: s.bg,
      color: s.color,
    }}>
      {status}
    </span>
  )
}
