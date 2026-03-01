import { createAdminClient } from '@/lib/supabase/server'

export const metadata = { title: 'Customers | Admin' }

export default async function CustomersPage() {
  const supabase = await createAdminClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('email, total, created_at')
    .in('status', ['paid', 'fulfilled'])

  // Aggregate by email
  const customerMap = new Map<string, { orders: number; spent: number; lastOrder: string }>()
  orders?.forEach(order => {
    const prev = customerMap.get(order.email)
    if (prev) {
      customerMap.set(order.email, {
        orders: prev.orders + 1,
        spent: prev.spent + Number(order.total),
        lastOrder: order.created_at > prev.lastOrder ? order.created_at : prev.lastOrder,
      })
    } else {
      customerMap.set(order.email, {
        orders: 1,
        spent: Number(order.total),
        lastOrder: order.created_at,
      })
    }
  })

  const customers = Array.from(customerMap.entries())
    .map(([email, data]) => ({ email, ...data }))
    .sort((a, b) => b.spent - a.spent)

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.75rem',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          Customers
        </h1>
        <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.45 }}>
          {customers.length} customer{customers.length !== 1 ? 's' : ''}
        </p>
      </div>

      {customers.length === 0 ? (
        <div
          style={{
            background: 'var(--muted)',
            borderRadius: '0.75rem',
            padding: '3rem',
            textAlign: 'center',
            opacity: 0.6,
          }}
        >
          No customers yet.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Email', 'Orders', 'Total spent', 'Last order'].map(h => (
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
              {customers.map((c, i) => (
                <tr
                  key={c.email}
                  style={{
                    borderBottom: i < customers.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                  className="hover:bg-[var(--muted)] transition-colors"
                >
                  <td style={{ padding: '0.875rem' }}>{c.email}</td>
                  <td style={{ padding: '0.875rem', opacity: 0.6 }}>{c.orders}</td>
                  <td style={{ padding: '0.875rem', fontWeight: 500 }}>${c.spent.toFixed(2)}</td>
                  <td style={{ padding: '0.875rem', opacity: 0.6, whiteSpace: 'nowrap' }}>
                    {new Date(c.lastOrder).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
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
