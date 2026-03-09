'use client'

import { useState } from 'react'
import Link from 'next/link'

type Order = {
  id: string
  order_number: number
  email: string
  created_at: string
  status: string
  fulfillment_status: string | null
  total: number
}

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

function Badge({ text, style }: { text: string; style: { bg: string; color: string } }) {
  return (
    <span style={{
      fontSize: '0.72rem',
      fontWeight: 600,
      padding: '0.2rem 0.6rem',
      borderRadius: '100px',
      background: style.bg,
      color: style.color,
      textTransform: 'capitalize' as const,
      whiteSpace: 'nowrap' as const,
    }}>
      {text}
    </span>
  )
}

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const [showUnfulfilledOnly, setShowUnfulfilledOnly] = useState(true)

  const filtered = showUnfulfilledOnly
    ? orders.filter(o => o.status === 'paid' && (o.fulfillment_status ?? 'unfulfilled') !== 'fulfilled')
    : orders

  return (
    <div>
      <style>{`
        .orders-desktop-table { display: block; }
        .orders-mobile-cards { display: none; }
        @media (max-width: 767px) {
          .orders-desktop-table { display: none; }
          .orders-mobile-cards { display: flex; flex-direction: column; gap: 0.375rem; }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={showUnfulfilledOnly}
            onChange={e => setShowUnfulfilledOnly(e.target.checked)}
          />
          Unfulfilled only
        </label>
        <span style={{ fontSize: '0.75rem', opacity: 0.4 }}>
          {filtered.length} order{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: 'var(--muted)', borderRadius: '0.75rem', padding: '3rem', textAlign: 'center', opacity: 0.6 }}>
          {showUnfulfilledOnly ? 'No unfulfilled orders.' : 'No orders yet.'}
        </div>
      ) : (
        <>
          {/* Desktop: full table */}
          <div className="orders-desktop-table">
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
                  {filtered.map(order => {
                    const statusStyle = STATUS_COLORS[order.status] ?? STATUS_COLORS.pending
                    const fulfillStyle = FULFILLMENT_COLORS[order.fulfillment_status ?? 'unfulfilled'] ?? FULFILLMENT_COLORS.unfulfilled
                    return (
                      <tr
                        key={order.id}
                        style={{ borderBottom: '1px solid var(--border)' }}
                        className="hover:bg-[var(--muted)] transition-colors"
                      >
                        <td style={{ padding: 0 }}>
                          <Link href={`/admin/orders/${order.id}`} style={{ display: 'block', padding: '0.875rem', textDecoration: 'none', color: 'inherit', fontWeight: 500 }}>
                            #{order.order_number}
                          </Link>
                        </td>
                        <td style={{ padding: 0, opacity: 0.7 }}>
                          <Link href={`/admin/orders/${order.id}`} style={{ display: 'block', padding: '0.875rem', textDecoration: 'none', color: 'inherit' }}>
                            {order.email}
                          </Link>
                        </td>
                        <td style={{ padding: 0, opacity: 0.6, whiteSpace: 'nowrap' }}>
                          <Link href={`/admin/orders/${order.id}`} style={{ display: 'block', padding: '0.875rem', textDecoration: 'none', color: 'inherit' }}>
                            {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Link>
                        </td>
                        <td style={{ padding: 0 }}>
                          <Link href={`/admin/orders/${order.id}`} style={{ display: 'block', padding: '0.875rem', textDecoration: 'none', color: 'inherit' }}>
                            <Badge text={order.status} style={statusStyle} />
                          </Link>
                        </td>
                        <td style={{ padding: 0 }}>
                          <Link href={`/admin/orders/${order.id}`} style={{ display: 'block', padding: '0.875rem', textDecoration: 'none', color: 'inherit' }}>
                            <Badge text={order.fulfillment_status ?? 'unfulfilled'} style={fulfillStyle} />
                          </Link>
                        </td>
                        <td style={{ padding: 0, fontWeight: 500 }}>
                          <Link href={`/admin/orders/${order.id}`} style={{ display: 'block', padding: '0.875rem', textDecoration: 'none', color: 'inherit' }}>
                            ${Number(order.total).toFixed(2)}
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile: card list */}
          <div className="orders-mobile-cards">
            {filtered.map(order => {
              const statusStyle = STATUS_COLORS[order.status] ?? STATUS_COLORS.pending
              const fulfillStyle = FULFILLMENT_COLORS[order.fulfillment_status ?? 'unfulfilled'] ?? FULFILLMENT_COLORS.unfulfilled
              const date = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

              return (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  style={{
                    display: 'block',
                    border: '1px solid var(--border)',
                    borderRadius: '0.75rem',
                    padding: '0.875rem',
                    textDecoration: 'none',
                    color: 'inherit',
                    background: 'var(--background)',
                  }}
                >
                  {/* Top row: order # + date */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>#{order.order_number}</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.45 }}>{date}</span>
                  </div>

                  {/* Middle row: email */}
                  <div style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '0.6rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {order.email}
                  </div>

                  {/* Bottom row: badges + total */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Badge text={order.status} style={statusStyle} />
                    <Badge text={order.fulfillment_status ?? 'unfulfilled'} style={fulfillStyle} />
                    <span style={{ marginLeft: 'auto', fontWeight: 600, fontSize: '0.875rem' }}>
                      ${Number(order.total).toFixed(2)}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
