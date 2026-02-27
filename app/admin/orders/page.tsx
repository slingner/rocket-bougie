import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'

export const metadata = { title: 'Orders — Admin' }

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:   { bg: 'var(--border)',  color: 'var(--foreground)' },
  paid:      { bg: '#fef3c7',        color: '#92400e' },
  fulfilled: { bg: '#dcfce7',        color: '#166534' },
  refunded:  { bg: '#fee2e2',        color: '#991b1b' },
  cancelled: { bg: '#fee2e2',        color: '#991b1b' },
}

const FULFILLMENT_COLORS: Record<string, { bg: string; color: string }> = {
  unfulfilled: { bg: 'var(--border)', color: 'var(--foreground)' },
  partial:     { bg: '#fef3c7',       color: '#92400e' },
  fulfilled:   { bg: '#dcfce7',       color: '#166534' },
}

export default async function OrdersPage() {
  const supabase = await createAdminClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, email, created_at, status, fulfillment_status, total')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.75rem',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          margin: '0 0 1.5rem',
        }}
      >
        Orders
      </h1>

      {!orders || orders.length === 0 ? (
        <div
          style={{
            background: 'var(--muted)',
            borderRadius: '0.75rem',
            padding: '3rem',
            textAlign: 'center',
            opacity: 0.6,
          }}
        >
          No orders yet.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Order', 'Customer', 'Date', 'Status', 'Fulfillment', 'Total'].map(h => (
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
              {orders.map((order) => {
                const statusStyle = STATUS_COLORS[order.status] ?? STATUS_COLORS.pending
                const fulfillStyle = FULFILLMENT_COLORS[order.fulfillment_status ?? 'unfulfilled'] ?? FULFILLMENT_COLORS.unfulfilled
                return (
                  <tr
                    key={order.id}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    className="hover:bg-[var(--muted)] transition-colors"
                  >
                    <td style={{ padding: '0.875rem' }}>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        style={{ textDecoration: 'none', color: 'inherit', fontWeight: 500 }}
                        className="hover:underline"
                      >
                        #{order.order_number}
                      </Link>
                    </td>
                    <td style={{ padding: '0.875rem', opacity: 0.7 }}>
                      <Link href={`/admin/orders/${order.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        {order.email}
                      </Link>
                    </td>
                    <td style={{ padding: '0.875rem', opacity: 0.6, whiteSpace: 'nowrap' }}>
                      <Link href={`/admin/orders/${order.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </Link>
                    </td>
                    <td style={{ padding: '0.875rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '100px',
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          textTransform: 'capitalize',
                        }}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '100px',
                          background: fulfillStyle.bg,
                          color: fulfillStyle.color,
                          textTransform: 'capitalize',
                        }}
                      >
                        {order.fulfillment_status ?? 'unfulfilled'}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem', fontWeight: 500 }}>
                      ${Number(order.total).toFixed(2)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
