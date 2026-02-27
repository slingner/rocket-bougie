'use client'

import { useState, useTransition } from 'react'
import { createDiscountCode, toggleDiscountActive, deleteDiscountCode } from '../actions'

type DiscountCode = {
  id: string
  code: string
  type: string
  value: number
  min_order_amount: number | null
  usage_limit: number | null
  usage_count: number
  expires_at: string | null
  active: boolean
  created_at: string
}

export default function DiscountsManager({ codes: initialCodes }: { codes: DiscountCode[] }) {
  const [codes, setCodes] = useState(initialCodes)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [code, setCode] = useState('')
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage')
  const [value, setValue] = useState('')
  const [minOrder, setMinOrder] = useState('')
  const [usageLimit, setUsageLimit] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  function resetForm() {
    setCode(''); setType('percentage'); setValue('')
    setMinOrder(''); setUsageLimit(''); setExpiresAt('')
    setError(null)
  }

  function handleCreate() {
    setError(null)
    if (!code.trim()) { setError('Code is required'); return }
    if (!value || isNaN(Number(value)) || Number(value) <= 0) { setError('Enter a valid value'); return }
    if (type === 'percentage' && Number(value) > 100) { setError('Percentage can\'t exceed 100'); return }

    startTransition(async () => {
      try {
        await createDiscountCode({
          code: code.trim(),
          type,
          value: Number(value),
          min_order_amount: minOrder ? Number(minOrder) : null,
          usage_limit: usageLimit ? Number(usageLimit) : null,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        })
        // Refresh by reloading — simplest since server handles the list
        window.location.reload()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to create code')
      }
    })
  }

  function handleToggle(id: string, active: boolean) {
    setCodes(prev => prev.map(c => c.id === id ? { ...c, active } : c))
    startTransition(async () => {
      await toggleDiscountActive(id, active)
    })
  }

  function handleDelete(id: string, codeStr: string) {
    if (!confirm(`Delete discount code "${codeStr}"? This also removes it from Stripe.`)) return
    setCodes(prev => prev.filter(c => c.id !== id))
    startTransition(async () => {
      await deleteDiscountCode(id)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Create button / form */}
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          style={{
            alignSelf: 'flex-start',
            background: 'var(--foreground)',
            color: 'var(--background)',
            border: 'none',
            padding: '0.55rem 1.25rem',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          + New code
        </button>
      ) : (
        <section style={{ background: 'var(--muted)', borderRadius: '0.875rem', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.4, margin: '0 0 1.25rem' }}>
            New discount code
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <label style={labelStyle}>
                <span style={labelText}>Code</span>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="SUMMER20"
                  style={inputStyle}
                  autoFocus
                />
              </label>
              <label style={labelStyle}>
                <span style={labelText}>Type</span>
                <select value={type} onChange={e => setType(e.target.value as 'percentage' | 'fixed')} style={inputStyle}>
                  <option value="percentage">Percentage off (%)</option>
                  <option value="fixed">Fixed amount off ($)</option>
                </select>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <label style={labelStyle}>
                <span style={labelText}>{type === 'percentage' ? 'Discount %' : 'Discount $'}</span>
                <input
                  type="number"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  placeholder={type === 'percentage' ? '20' : '10.00'}
                  min="0"
                  max={type === 'percentage' ? 100 : undefined}
                  step={type === 'percentage' ? '1' : '0.01'}
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                <span style={labelText}>Min. order ($)</span>
                <input
                  type="number"
                  value={minOrder}
                  onChange={e => setMinOrder(e.target.value)}
                  placeholder="Optional"
                  min="0"
                  step="0.01"
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                <span style={labelText}>Usage limit</span>
                <input
                  type="number"
                  value={usageLimit}
                  onChange={e => setUsageLimit(e.target.value)}
                  placeholder="Unlimited"
                  min="1"
                  style={inputStyle}
                />
              </label>
            </div>

            <label style={labelStyle}>
              <span style={labelText}>Expiry date (optional)</span>
              <input
                type="date"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
                style={{ ...inputStyle, maxWidth: 200 }}
              />
            </label>

            {error && (
              <p style={{ fontSize: '0.8rem', color: '#991b1b', margin: 0 }}>{error}</p>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={handleCreate}
                disabled={isPending}
                style={{
                  background: 'var(--foreground)',
                  color: 'var(--background)',
                  border: 'none',
                  padding: '0.6rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  opacity: isPending ? 0.6 : 1,
                  fontFamily: 'inherit',
                }}
              >
                {isPending ? 'Creating…' : 'Create code'}
              </button>
              <button
                type="button"
                onClick={() => { resetForm(); setShowForm(false) }}
                style={{
                  background: 'none',
                  border: '1px solid var(--border)',
                  padding: '0.6rem 1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  color: 'var(--foreground)',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Codes list */}
      {codes.length === 0 ? (
        <div style={{ background: 'var(--muted)', borderRadius: '0.875rem', padding: '3rem', textAlign: 'center', opacity: 0.5 }}>
          No discount codes yet.
        </div>
      ) : (
        <div style={{ background: 'var(--muted)', borderRadius: '0.875rem', overflow: 'hidden' }}>
          {codes.map((c, i) => {
            const expired = c.expires_at ? new Date(c.expires_at) < new Date() : false
            const exhausted = c.usage_limit !== null && c.usage_count >= c.usage_limit
            const inactive = !c.active || expired || exhausted

            return (
              <div
                key={c.id}
                style={{
                  padding: '1rem 1.25rem',
                  borderBottom: i < codes.length - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  opacity: inactive ? 0.5 : 1,
                }}
              >
                {/* Code + value */}
                <div style={{ flex: 1, minWidth: 120 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.03em', fontFamily: 'monospace' }}>
                    {c.code}
                  </p>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', opacity: 0.55 }}>
                    {c.type === 'percentage' ? `${c.value}% off` : `$${Number(c.value).toFixed(2)} off`}
                    {c.min_order_amount && ` · min $${Number(c.min_order_amount).toFixed(2)}`}
                  </p>
                </div>

                {/* Usage */}
                <div style={{ minWidth: 80, textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>
                    {c.usage_count}{c.usage_limit ? `/${c.usage_limit}` : ''}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.72rem', opacity: 0.4 }}>uses</p>
                </div>

                {/* Expiry */}
                <div style={{ minWidth: 100, textAlign: 'center' }}>
                  {c.expires_at ? (
                    <>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: expired ? '#991b1b' : 'inherit' }}>
                        {expired ? 'Expired' : new Date(c.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </>
                  ) : (
                    <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.3 }}>No expiry</p>
                  )}
                </div>

                {/* Status toggle */}
                <button
                  type="button"
                  onClick={() => !expired && !exhausted && handleToggle(c.id, !c.active)}
                  disabled={expired || exhausted}
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.2rem 0.65rem',
                    borderRadius: '100px',
                    border: 'none',
                    cursor: expired || exhausted ? 'default' : 'pointer',
                    fontFamily: 'inherit',
                    background: c.active && !expired && !exhausted ? '#dcfce7' : 'var(--border)',
                    color: c.active && !expired && !exhausted ? '#166534' : 'var(--foreground)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {expired ? 'Expired' : exhausted ? 'Exhausted' : c.active ? 'Active' : 'Inactive'}
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDelete(c.id, c.code)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    opacity: 0.4,
                    padding: 0,
                    fontFamily: 'inherit',
                    color: 'var(--foreground)',
                  }}
                  className="hover:opacity-100"
                >
                  Delete
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.375rem' }
const labelText: React.CSSProperties = { fontSize: '0.8rem', fontWeight: 500, opacity: 0.6 }
const inputStyle: React.CSSProperties = {
  padding: '0.6rem 0.875rem',
  borderRadius: '0.5rem',
  border: '1px solid var(--border)',
  background: 'var(--background)',
  fontSize: '0.875rem',
  color: 'var(--foreground)',
  fontFamily: 'inherit',
  width: '100%',
}
