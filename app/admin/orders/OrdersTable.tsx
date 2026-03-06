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

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showUnfulfilledOnly, setShowUnfulfilledOnly] = useState(true)
  const [exporting, setExporting] = useState(false)

  const filtered = showUnfulfilledOnly
    ? orders.filter(o => o.status === 'paid' && (o.fulfillment_status ?? 'unfulfilled') !== 'fulfilled')
    : orders

  const allSelected = filtered.length > 0 && filtered.every(o => selected.has(o.id))

  function toggleAll() {
    if (allSelected) {
      setSelected(prev => {
        const next = new Set(prev)
        filtered.forEach(o => next.delete(o.id))
        return next
      })
    } else {
      setSelected(prev => {
        const next = new Set(prev)
        filtered.forEach(o => next.add(o.id))
        return next
      })
    }
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function exportCsv() {
    const ids = Array.from(selected).join(',')
    if (!ids) return
    setExporting(true)
    try {
      const res = await fetch(`/api/admin/orders/export?ids=${ids}`)
      if (!res.ok) { alert('Export failed'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pirateship-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const selectedInView = filtered.filter(o => selected.has(o.id)).length

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={showUnfulfilledOnly}
            onChange={e => { setShowUnfulfilledOnly(e.target.checked); setSelected(new Set()) }}
          />
          Unfulfilled only
        </label>

        <span style={{ fontSize: '0.75rem', opacity: 0.4 }}>
          {filtered.length} order{filtered.length !== 1 ? 's' : ''}
        </span>

        {selected.size > 0 && (
          <button
            onClick={exportCsv}
            disabled={exporting}
            style={{
              marginLeft: 'auto',
              padding: '0.45rem 1rem',
              borderRadius: '0.4rem',
              border: 'none',
              background: 'var(--foreground)',
              color: 'var(--background)',
              fontSize: '0.8rem',
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            {exporting ? 'Exporting…' : `Export ${selectedInView} for Pirateship ↓`}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: 'var(--muted)', borderRadius: '0.75rem', padding: '3rem', textAlign: 'center', opacity: 0.6 }}>
          {showUnfulfilledOnly ? 'No unfulfilled orders.' : 'No orders yet.'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '0.625rem 0.75rem', width: 36 }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
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
                const isSelected = selected.has(order.id)
                const statusStyle = STATUS_COLORS[order.status] ?? STATUS_COLORS.pending
                const fulfillStyle = FULFILLMENT_COLORS[order.fulfillment_status ?? 'unfulfilled'] ?? FULFILLMENT_COLORS.unfulfilled
                return (
                  <tr
                    key={order.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: isSelected ? 'var(--muted)' : undefined,
                    }}
                    className="hover:bg-[var(--muted)] transition-colors"
                  >
                    <td style={{ padding: '0.75rem' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(order.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
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
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '100px', background: statusStyle.bg, color: statusStyle.color, textTransform: 'capitalize' }}>
                          {order.status}
                        </span>
                      </Link>
                    </td>
                    <td style={{ padding: 0 }}>
                      <Link href={`/admin/orders/${order.id}`} style={{ display: 'block', padding: '0.875rem', textDecoration: 'none', color: 'inherit' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '100px', background: fulfillStyle.bg, color: fulfillStyle.color, textTransform: 'capitalize' }}>
                          {order.fulfillment_status ?? 'unfulfilled'}
                        </span>
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
      )}
    </div>
  )
}
