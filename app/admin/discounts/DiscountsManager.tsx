'use client'

import { useState, useTransition } from 'react'
import {
  createDiscountCode, toggleDiscountActive, deleteDiscountCode,
  createDiscountRule, toggleDiscountRule, deleteDiscountRule,
} from '../actions'

type DiscountCode = {
  id: string
  code: string
  type: string
  value: number
  min_order_amount: number | null
  usage_limit: number | null
  usage_count: number
  expires_at: string | null
  first_time_only: boolean
  active: boolean
  created_at: string
}

type DiscountRule = {
  id: string
  name: string
  description: string | null
  active: boolean
  applies_to_tag: string | null
  type: 'bundle_price' | 'nth_free' | 'percent_off'
  bundle_qty: number | null
  bundle_price: number | null
  buy_qty: number | null
  get_qty: number | null
  percent_off: number | null
  sort_order: number
}

export default function DiscountsManager({
  codes: initialCodes,
  rules: initialRules,
}: {
  codes: DiscountCode[]
  rules: DiscountRule[]
}) {
  const [codes, setCodes] = useState(initialCodes)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Rules state
  const [rules, setRules] = useState(initialRules)
  const [showRuleForm, setShowRuleForm] = useState(false)
  const [ruleError, setRuleError] = useState<string | null>(null)
  const [ruleName, setRuleName] = useState('')
  const [ruleType, setRuleType] = useState<'bundle_price' | 'nth_free' | 'percent_off'>('bundle_price')
  const [ruleTag, setRuleTag] = useState('')
  const [ruleBundleQty, setRuleBundleQty] = useState('')
  const [ruleBundlePrice, setRuleBundlePrice] = useState('')
  const [ruleBuyQty, setRuleBuyQty] = useState('')
  const [ruleGetQty, setRuleGetQty] = useState('')
  const [rulePercentOff, setRulePercentOff] = useState('')

  function resetRuleForm() {
    setRuleName(''); setRuleType('bundle_price'); setRuleTag('')
    setRuleBundleQty(''); setRuleBundlePrice(''); setRuleBuyQty('')
    setRuleGetQty(''); setRulePercentOff(''); setRuleError(null)
  }

  function handleCreateRule() {
    setRuleError(null)
    if (!ruleName.trim()) { setRuleError('Name is required'); return }
    if (ruleType === 'bundle_price') {
      if (!ruleBundleQty || !ruleBundlePrice) { setRuleError('Bundle qty and price required'); return }
    } else if (ruleType === 'nth_free') {
      if (!ruleBuyQty || !ruleGetQty) { setRuleError('Buy qty and get qty required'); return }
    } else if (ruleType === 'percent_off') {
      if (!rulePercentOff) { setRuleError('Percent off required'); return }
    }

    startTransition(async () => {
      try {
        await createDiscountRule({
          name: ruleName.trim(),
          type: ruleType,
          applies_to_tag: ruleTag.trim() || null,
          bundle_qty: ruleType === 'bundle_price' ? Number(ruleBundleQty) : null,
          bundle_price: ruleType === 'bundle_price' ? Number(ruleBundlePrice) : null,
          buy_qty: ruleType === 'nth_free' ? Number(ruleBuyQty) : null,
          get_qty: ruleType === 'nth_free' ? Number(ruleGetQty) : null,
          percent_off: ruleType === 'percent_off' ? Number(rulePercentOff) : null,
        })
        window.location.reload()
      } catch (e) {
        setRuleError(e instanceof Error ? e.message : 'Failed to create rule')
      }
    })
  }

  function handleToggleRule(id: string, active: boolean) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active } : r))
    startTransition(async () => { await toggleDiscountRule(id, active) })
  }

  function handleDeleteRule(id: string, name: string) {
    if (!confirm(`Delete rule "${name}"?`)) return
    setRules(prev => prev.filter(r => r.id !== id))
    startTransition(async () => { await deleteDiscountRule(id) })
  }

  // Form state
  const [code, setCode] = useState('')
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage')
  const [value, setValue] = useState('')
  const [minOrder, setMinOrder] = useState('')
  const [usageLimit, setUsageLimit] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [firstTimeOnly, setFirstTimeOnly] = useState(false)

  function resetForm() {
    setCode(''); setType('percentage'); setValue('')
    setMinOrder(''); setUsageLimit(''); setExpiresAt('')
    setFirstTimeOnly(false); setError(null)
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
          first_time_only: firstTimeOnly,
        })
        // Refresh by reloading (simplest since server handles the list)
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

            <label
              style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}
            >
              <input
                type="checkbox"
                checked={firstTimeOnly}
                onChange={e => setFirstTimeOnly(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--foreground)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.875rem' }}>First-time customers only</span>
              <span style={{ fontSize: '0.775rem', opacity: 0.45 }}>(enforced by Stripe)</span>
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
                    {c.first_time_only && (
                      <span style={{
                        marginLeft: '0.5rem',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        background: '#ede9fe',
                        color: '#5b21b6',
                        padding: '0.1rem 0.4rem',
                        borderRadius: 4,
                        letterSpacing: '0.02em',
                      }}>
                        First-time
                      </span>
                    )}
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
      {/* ── Volume Deals ── */}
      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.4, margin: '0 0 1rem' }}>
          Volume Deals
        </h2>
        <p style={{ fontSize: '0.8rem', opacity: 0.45, margin: '0 0 1.25rem' }}>
          Applied automatically at checkout based on cart contents. Stacks with promo codes.
        </p>

        {!showRuleForm ? (
          <button
            type="button"
            onClick={() => setShowRuleForm(true)}
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
              marginBottom: '1rem',
              display: 'block',
            }}
          >
            + New deal
          </button>
        ) : (
          <section style={{ background: 'var(--muted)', borderRadius: '0.875rem', padding: '1.5rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.4, margin: '0 0 1.25rem' }}>
              New volume deal
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <label style={labelStyle}>
                  <span style={labelText}>Name</span>
                  <input
                    type="text"
                    value={ruleName}
                    onChange={e => setRuleName(e.target.value)}
                    placeholder="4 Mini Prints for $16"
                    style={inputStyle}
                    autoFocus
                  />
                </label>
                <label style={labelStyle}>
                  <span style={labelText}>Type</span>
                  <select value={ruleType} onChange={e => setRuleType(e.target.value as typeof ruleType)} style={inputStyle}>
                    <option value="bundle_price">Bundle price (X items for $Y)</option>
                    <option value="nth_free">Nth free (buy X get Y free)</option>
                    <option value="percent_off">Percent off</option>
                  </select>
                </label>
              </div>

              <label style={labelStyle}>
                <span style={labelText}>Applies to tag <span style={{ opacity: 0.5 }}>(leave blank for sitewide)</span></span>
                <input
                  type="text"
                  value={ruleTag}
                  onChange={e => setRuleTag(e.target.value)}
                  placeholder="mini-print, sticker, print…"
                  style={{ ...inputStyle, maxWidth: 280 }}
                />
              </label>

              {ruleType === 'bundle_price' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <label style={labelStyle}>
                    <span style={labelText}>Bundle qty</span>
                    <input type="number" min="2" value={ruleBundleQty} onChange={e => setRuleBundleQty(e.target.value)} placeholder="4" style={inputStyle} />
                  </label>
                  <label style={labelStyle}>
                    <span style={labelText}>Bundle price ($)</span>
                    <input type="number" min="0" step="0.01" value={ruleBundlePrice} onChange={e => setRuleBundlePrice(e.target.value)} placeholder="16.00" style={inputStyle} />
                  </label>
                </div>
              )}

              {ruleType === 'nth_free' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <label style={labelStyle}>
                    <span style={labelText}>Buy qty</span>
                    <input type="number" min="1" value={ruleBuyQty} onChange={e => setRuleBuyQty(e.target.value)} placeholder="3" style={inputStyle} />
                  </label>
                  <label style={labelStyle}>
                    <span style={labelText}>Get free qty</span>
                    <input type="number" min="1" value={ruleGetQty} onChange={e => setRuleGetQty(e.target.value)} placeholder="1" style={inputStyle} />
                  </label>
                </div>
              )}

              {ruleType === 'percent_off' && (
                <label style={labelStyle}>
                  <span style={labelText}>Percent off (%)</span>
                  <input type="number" min="1" max="100" value={rulePercentOff} onChange={e => setRulePercentOff(e.target.value)} placeholder="10" style={{ ...inputStyle, maxWidth: 160 }} />
                </label>
              )}

              {ruleError && <p style={{ fontSize: '0.8rem', color: '#991b1b', margin: 0 }}>{ruleError}</p>}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleCreateRule}
                  disabled={isPending}
                  style={{ background: 'var(--foreground)', color: 'var(--background)', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600, cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.6 : 1, fontFamily: 'inherit' }}
                >
                  {isPending ? 'Creating…' : 'Create deal'}
                </button>
                <button
                  type="button"
                  onClick={() => { resetRuleForm(); setShowRuleForm(false) }}
                  style={{ background: 'none', border: '1px solid var(--border)', padding: '0.6rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--foreground)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </section>
        )}

        {rules.length === 0 ? (
          <div style={{ background: 'var(--muted)', borderRadius: '0.875rem', padding: '3rem', textAlign: 'center', opacity: 0.5 }}>
            No volume deals yet.
          </div>
        ) : (
          <div style={{ background: 'var(--muted)', borderRadius: '0.875rem', overflow: 'hidden' }}>
            {rules.map((r, i) => {
              const summary = r.type === 'bundle_price'
                ? `${r.bundle_qty} for $${Number(r.bundle_price).toFixed(2)}`
                : r.type === 'nth_free'
                ? `Buy ${r.buy_qty}, get ${r.get_qty} free`
                : `${r.percent_off}% off`

              return (
                <div
                  key={r.id}
                  style={{
                    padding: '1rem 1.25rem',
                    borderBottom: i < rules.length - 1 ? '1px solid var(--border)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    opacity: r.active ? 1 : 0.5,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{r.name}</p>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', opacity: 0.55 }}>
                      {summary}
                      {r.applies_to_tag && ` · tag: ${r.applies_to_tag}`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleRule(r.id, !r.active)}
                    style={{
                      fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.65rem', borderRadius: '100px', border: 'none',
                      cursor: 'pointer', fontFamily: 'inherit',
                      background: r.active ? '#dcfce7' : 'var(--border)',
                      color: r.active ? '#166534' : 'var(--foreground)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {r.active ? 'Active' : 'Inactive'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteRule(r.id, r.name)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', opacity: 0.4, padding: 0, fontFamily: 'inherit', color: 'var(--foreground)' }}
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
