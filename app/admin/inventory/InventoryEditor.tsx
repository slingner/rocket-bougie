'use client'

import { useState, useTransition } from 'react'
import { bulkUpdateInventory } from '../actions'

type VariantRow = {
  id: string
  sku: string | null
  option1_name: string | null
  option1_value: string | null
  option2_name: string | null
  option2_value: string | null
  inventory_quantity: number
  inventory_policy: string
}

type Grouped = Record<string, { title: string; variants: VariantRow[] }>

export default function InventoryEditor({ grouped }: { grouped: Grouped }) {
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    for (const { variants } of Object.values(grouped)) {
      for (const v of variants) {
        init[v.id] = v.inventory_quantity
      }
    }
    return init
  })
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(false)
    const updates = Object.entries(quantities).map(([id, inventory_quantity]) => ({
      id,
      inventory_quantity,
    }))
    startTransition(async () => {
      await bulkUpdateInventory(updates)
      setSaved(true)
    })
  }

  const productIds = Object.keys(grouped)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {productIds.map((pid) => {
        const { title, variants } = grouped[pid]
        return (
          <div
            key={pid}
            style={{
              background: 'var(--muted)',
              borderRadius: '0.875rem',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '0.875rem 1.25rem',
                borderBottom: '1px solid var(--border)',
                fontWeight: 500,
                fontSize: '0.9rem',
              }}
            >
              {title}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Variant', 'SKU', 'Policy', 'Quantity'].map(h => (
                    <th
                      key={h}
                      style={{
                        padding: '0.5rem 1.25rem',
                        textAlign: 'left',
                        fontWeight: 600,
                        fontSize: '0.72rem',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        opacity: 0.4,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {variants.map(v => {
                  const variantLabel =
                    v.option1_value === 'Default Title'
                      ? '—'
                      : [v.option1_value, v.option2_value].filter(Boolean).join(' / ')

                  const qty = quantities[v.id] ?? 0
                  const isLow = qty === 0

                  return (
                    <tr
                      key={v.id}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        background: isLow ? 'rgba(153, 27, 27, 0.05)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '0.625rem 1.25rem', opacity: 0.75 }}>{variantLabel}</td>
                      <td style={{ padding: '0.625rem 1.25rem', opacity: 0.4, fontSize: '0.8rem', fontFamily: 'monospace' }}>
                        {v.sku ?? '—'}
                      </td>
                      <td style={{ padding: '0.625rem 1.25rem', opacity: 0.5, textTransform: 'capitalize' }}>
                        {v.inventory_policy}
                      </td>
                      <td style={{ padding: '0.5rem 1.25rem' }}>
                        <input
                          type="number"
                          value={qty}
                          onChange={e => {
                            setSaved(false)
                            setQuantities(prev => ({ ...prev, [v.id]: parseInt(e.target.value) || 0 }))
                          }}
                          min={0}
                          style={{
                            width: 72,
                            padding: '0.35rem 0.5rem',
                            borderRadius: '0.375rem',
                            border: '1px solid var(--border)',
                            background: 'var(--background)',
                            fontSize: '0.875rem',
                            color: isLow ? '#991b1b' : 'var(--foreground)',
                            fontFamily: 'inherit',
                            fontWeight: isLow ? 600 : 400,
                          }}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      })}

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '2rem' }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          style={{
            background: 'var(--foreground)',
            color: 'var(--background)',
            border: 'none',
            padding: '0.7rem 1.75rem',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: isPending ? 'not-allowed' : 'pointer',
            opacity: isPending ? 0.6 : 1,
            fontFamily: 'inherit',
          }}
        >
          {isPending ? 'Saving…' : 'Save all changes'}
        </button>
        {saved && (
          <span style={{ fontSize: '0.875rem', color: '#166534', fontWeight: 500 }}>
            Inventory updated.
          </span>
        )}
      </div>
    </div>
  )
}
