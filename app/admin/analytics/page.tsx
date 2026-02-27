import { createAdminClient } from '@/lib/supabase/server'
import RevenueChart from './RevenueChart'

export const metadata = { title: 'Analytics — Admin' }

type OrderItem = { title: string; quantity: number; total_price: number }

export default async function AnalyticsPage() {
  const supabase = await createAdminClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('id, created_at, total, email, order_items(title, quantity, total_price)')
    .in('status', ['paid', 'fulfilled'])
    .order('created_at', { ascending: true })

  // Stat cards
  const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0
  const totalOrders = orders?.length ?? 0
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const uniqueCustomers = new Set(orders?.map(o => o.email)).size

  // Monthly revenue — last 12 months
  const now = new Date()
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      year: d.getFullYear(),
      month: d.getMonth(),
      revenue: 0,
    }
  })

  orders?.forEach(order => {
    const d = new Date(order.created_at)
    const entry = months.find(m => m.year === d.getFullYear() && m.month === d.getMonth())
    if (entry) entry.revenue += Number(order.total)
  })

  // Top products
  const productMap = new Map<string, { units: number; revenue: number }>()
  orders?.forEach(order => {
    ;(order.order_items as OrderItem[])?.forEach(item => {
      const prev = productMap.get(item.title) ?? { units: 0, revenue: 0 }
      productMap.set(item.title, {
        units: prev.units + item.quantity,
        revenue: prev.revenue + Number(item.total_price),
      })
    })
  })
  const topProducts = Array.from(productMap.entries())
    .map(([title, data]) => ({ title, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  return (
    <div style={{ maxWidth: 900 }}>
      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.75rem',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          margin: '0 0 1.75rem',
        }}
      >
        Analytics
      </h1>

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        {[
          {
            label: 'Total revenue',
            value: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          },
          { label: 'Total orders', value: totalOrders.toLocaleString() },
          { label: 'Avg order value', value: `$${avgOrderValue.toFixed(2)}` },
          { label: 'Unique customers', value: uniqueCustomers.toLocaleString() },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{ background: 'var(--muted)', borderRadius: '0.875rem', padding: '1.25rem 1.5rem' }}
          >
            <p
              style={{
                margin: '0 0 0.375rem',
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                opacity: 0.4,
              }}
            >
              {label}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: '1.75rem',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                fontFamily: 'var(--font-serif)',
              }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Monthly revenue bar chart */}
      <section style={{ marginBottom: '2rem' }}>
        <h2
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            opacity: 0.4,
            margin: '0 0 0.75rem',
          }}
        >
          Revenue — last 12 months
        </h2>
        <RevenueChart months={months} />
      </section>

      {/* Top products */}
      <section>
        <h2
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            opacity: 0.4,
            margin: '0 0 0.75rem',
          }}
        >
          Top products
        </h2>
        {topProducts.length === 0 ? (
          <div
            style={{
              background: 'var(--muted)',
              borderRadius: '0.875rem',
              padding: '2rem',
              textAlign: 'center',
              opacity: 0.5,
            }}
          >
            No sales data yet.
          </div>
        ) : (
          <div style={{ background: 'var(--muted)', borderRadius: '0.875rem', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Product', 'Units sold', 'Revenue'].map(h => (
                    <th
                      key={h}
                      style={{
                        padding: '0.75rem 1.25rem',
                        textAlign: h === 'Product' ? 'left' : 'right',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        opacity: 0.45,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr
                    key={p.title}
                    style={{
                      borderBottom: i < topProducts.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <td style={{ padding: '0.875rem 1.25rem', fontWeight: 500 }}>{p.title}</td>
                    <td style={{ padding: '0.875rem 1.25rem', textAlign: 'right', opacity: 0.65 }}>
                      {p.units}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', textAlign: 'right', fontWeight: 600 }}>
                      ${p.revenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
