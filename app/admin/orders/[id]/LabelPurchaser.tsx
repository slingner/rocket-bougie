'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Rate = {
  object_id: string
  provider: string
  servicelevel: { name: string; token: string }
  amount: string
  currency: string
  estimated_days: number | null
  duration_terms: string | null
}

export default function LabelPurchaser({
  orderId,
  existingLabelUrl,
  existingTrackingNumber,
}: {
  orderId: string
  existingLabelUrl: string | null
  existingTrackingNumber: string | null
}) {
  const router = useRouter()
  const [rates, setRates] = useState<Rate[]>([])
  const [selectedRate, setSelectedRate] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [purchased, setPurchased] = useState<{ labelUrl: string; trackingNumber: string } | null>(null)

  const labelUrl = purchased?.labelUrl ?? existingLabelUrl
  const trackingNumber = purchased?.trackingNumber ?? existingTrackingNumber
  const alreadyHasLabel = !!labelUrl

  async function fetchRates() {
    setLoading(true)
    setError(null)
    setRates([])
    setSelectedRate(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/rates`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to get rates'); return }
      setRates(data.rates)
      if (data.rates.length > 0) setSelectedRate(data.rates[0].object_id)
    } catch {
      setError('Failed to connect to Shippo')
    } finally {
      setLoading(false)
    }
  }

  async function buyLabel() {
    if (!selectedRate) return
    setPurchasing(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rateId: selectedRate }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Purchase failed'); return }
      setPurchased({ labelUrl: data.labelUrl, trackingNumber: data.trackingNumber })
      router.refresh() // Re-fetch order so tracking field updates
    } catch {
      setError('Purchase failed')
    } finally {
      setPurchasing(false)
    }
  }

  const sectionStyle: React.CSSProperties = {
    background: 'var(--muted)',
    borderRadius: '0.875rem',
    padding: '1.25rem 1.5rem',
  }

  const btnStyle = (variant: 'primary' | 'ghost' = 'primary'): React.CSSProperties => ({
    padding: '0.55rem 1.25rem',
    borderRadius: '0.5rem',
    border: variant === 'ghost' ? '1px solid var(--border)' : 'none',
    background: variant === 'primary' ? 'var(--foreground)' : 'transparent',
    color: variant === 'primary' ? 'var(--background)' : 'var(--foreground)',
    fontSize: '0.875rem',
    fontWeight: 600,
    fontFamily: 'inherit',
    cursor: 'pointer',
  })

  return (
    <section style={{ marginTop: '1.5rem' }}>
      <h2 style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.4, margin: '0 0 0.75rem' }}>
        Shipping Label
      </h2>

      <div style={sectionStyle}>

        {/* Already has a label */}
        {alreadyHasLabel && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>Label purchased</p>
              {trackingNumber && (
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', opacity: 0.6, fontFamily: 'monospace' }}>
                  {trackingNumber}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <a
                href={labelUrl!}
                target="_blank"
                rel="noreferrer"
                style={{ ...btnStyle('primary'), textDecoration: 'none', display: 'inline-block' }}
              >
                Open Label PDF ↗
              </a>
              {!purchased && (
                <button style={btnStyle('ghost')} onClick={fetchRates} disabled={loading}>
                  Buy another
                </button>
              )}
            </div>
          </div>
        )}

        {/* No label yet — idle state */}
        {!alreadyHasLabel && rates.length === 0 && !loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.6 }}>
              Get live USPS rates and buy a label directly.
            </p>
            <button style={btnStyle()} onClick={fetchRates}>
              Get Rates
            </button>
          </div>
        )}

        {/* Loading rates */}
        {loading && (
          <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.5 }}>Fetching rates…</p>
        )}

        {/* Rate list */}
        {rates.length > 0 && !purchased && (
          <div>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', opacity: 0.5 }}>
              Select a service:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              {rates.map(rate => (
                <label
                  key={rate.object_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    border: `1px solid ${selectedRate === rate.object_id ? 'var(--foreground)' : 'var(--border)'}`,
                    background: selectedRate === rate.object_id ? 'var(--background)' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="rate"
                    value={rate.object_id}
                    checked={selectedRate === rate.object_id}
                    onChange={() => setSelectedRate(rate.object_id)}
                    style={{ accentColor: 'var(--foreground)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>
                      {rate.provider} — {rate.servicelevel.name}
                    </p>
                    {rate.estimated_days != null && (
                      <p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', opacity: 0.5 }}>
                        Est. {rate.estimated_days} day{rate.estimated_days !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    ${Number(rate.amount).toFixed(2)}
                  </span>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button style={btnStyle()} onClick={buyLabel} disabled={!selectedRate || purchasing}>
                {purchasing
                  ? 'Purchasing…'
                  : `Purchase Label — $${Number(rates.find(r => r.object_id === selectedRate)?.amount ?? 0).toFixed(2)}`
                }
              </button>
              <button style={btnStyle('ghost')} onClick={() => { setRates([]); setSelectedRate(null) }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && (
          <p style={{ margin: '0.75rem 0 0', fontSize: '0.8rem', color: '#dc2626' }}>{error}</p>
        )}
      </div>
    </section>
  )
}
