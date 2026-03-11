'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type ShippoRate = {
  object_id: string
  provider: string
  servicelevel: { name: string; token: string }
  amount: string
  currency: string
  estimated_days: number | null
  duration_terms: string | null
}

type PBRate = {
  id: string
  carrier: string
  serviceId: string
  parcelType: string
  serviceName: string
  totalCharge: number
  currency: string
  estimatedDays: string | null
  estimatedDelivery: string | null
}

type SelectedRate =
  | { source: 'shippo'; rateId: string; amount: number }
  | { source: 'pb'; carrier: string; serviceId: string; parcelType: string; amount: number }
  | null

type Parcel = {
  profileName: string | null
  totalPounds: number
  lengthIn: number
  widthIn: number
  heightIn: number
  usingFallback: boolean
  anyUnassigned: boolean
  items: Array<{ title: string; quantity: number; profileName: string | null; pounds: number }>
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
  const [shippoRates, setShippoRates] = useState<ShippoRate[]>([])
  const [pbRates, setPBRates] = useState<PBRate[]>([])
  const [parcel, setParcel] = useState<Parcel | null>(null)
  const [selected, setSelected] = useState<SelectedRate>(null)
  const [loading, setLoading] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shippoError, setShippoError] = useState<string | null>(null)
  const [pbError, setPBError] = useState<string | null>(null)
  const [purchased, setPurchased] = useState<{ labelUrl: string; trackingNumber: string } | null>(null)

  const labelUrl = purchased?.labelUrl ?? existingLabelUrl
  const trackingNumber = purchased?.trackingNumber ?? existingTrackingNumber
  const alreadyHasLabel = !!labelUrl
  const hasRates = shippoRates.length > 0 || pbRates.length > 0

  async function fetchRates() {
    setLoading(true)
    setError(null)
    setShippoError(null)
    setPBError(null)
    setShippoRates([])
    setPBRates([])
    setParcel(null)
    setSelected(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/rates`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to get rates'); return }
      const pb: PBRate[] = data.pbRates ?? []
      const shippo: ShippoRate[] = data.shippoRates ?? []
      setPBRates(pb)
      setShippoRates(shippo)
      setParcel(data.parcel ?? null)
      setShippoError(data.shippoError ?? null)
      setPBError(data.pbError ?? null)
      // Auto-select cheapest PB rate if available, otherwise cheapest Shippo
      if (pb.length > 0) {
        const r = pb[0]
        setSelected({ source: 'pb', carrier: r.carrier, serviceId: r.serviceId, parcelType: r.parcelType, amount: r.totalCharge })
      } else if (shippo.length > 0) {
        const r = shippo[0]
        setSelected({ source: 'shippo', rateId: r.object_id, amount: Number(r.amount) })
      }
    } catch {
      setError('Failed to connect to shipping APIs')
    } finally {
      setLoading(false)
    }
  }

  async function buyLabel() {
    if (!selected) return
    setPurchasing(true)
    setError(null)
    try {
      let res: Response
      if (selected.source === 'pb') {
        res = await fetch(`/api/admin/orders/${orderId}/purchase-pb`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ carrier: selected.carrier, serviceId: selected.serviceId, parcelType: selected.parcelType }),
        })
      } else {
        res = await fetch(`/api/admin/orders/${orderId}/purchase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rateId: selected.rateId }),
        })
      }
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Purchase failed'); return }
      setPurchased({ labelUrl: data.labelUrl, trackingNumber: data.trackingNumber })
      router.refresh()
    } catch {
      setError('Purchase failed')
    } finally {
      setPurchasing(false)
    }
  }

  function selectPB(rate: PBRate) {
    setSelected({ source: 'pb', carrier: rate.carrier, serviceId: rate.serviceId, parcelType: rate.parcelType, amount: rate.totalCharge })
  }

  function selectShippo(rate: ShippoRate) {
    setSelected({ source: 'shippo', rateId: rate.object_id, amount: Number(rate.amount) })
  }

  function isSelectedPB(rate: PBRate) {
    return selected?.source === 'pb' && selected.serviceId === rate.serviceId && selected.carrier === rate.carrier
  }

  function isSelectedShippo(rate: ShippoRate) {
    return selected?.source === 'shippo' && selected.rateId === rate.object_id
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

  const rateRowStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    border: `1px solid ${active ? 'var(--foreground)' : 'var(--border)'}`,
    background: active ? 'var(--background)' : 'transparent',
    cursor: 'pointer',
  })

  const providerLabel = (text: string, bg: string): React.ReactNode => (
    <span style={{
      display: 'inline-block',
      padding: '0.1rem 0.45rem',
      borderRadius: '100px',
      background: bg,
      color: '#fff',
      fontSize: '0.65rem',
      fontWeight: 700,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      marginLeft: '0.4rem',
      verticalAlign: 'middle',
    }}>{text}</span>
  )

  const sectionHeading = (label: string): React.ReactNode => (
    <p style={{ margin: '0 0 0.6rem', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.45 }}>
      {label}
    </p>
  )

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

        {/* Idle */}
        {!alreadyHasLabel && !hasRates && !loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.6 }}>
              Compare rates from Pitney Bowes and Shippo, then buy a label.
            </p>
            <button style={btnStyle()} onClick={fetchRates}>
              Get Rates
            </button>
          </div>
        )}

        {loading && (
          <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.5 }}>Fetching rates…</p>
        )}

        {/* Rate list */}
        {hasRates && !purchased && (
          <div>
            {/* Parcel summary */}
            {parcel && (
              <div style={{
                background: parcel.usingFallback || parcel.anyUnassigned ? '#fef9c3' : 'var(--background)',
                border: `1px solid ${parcel.usingFallback || parcel.anyUnassigned ? '#fde047' : 'var(--border)'}`,
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                fontSize: '0.8rem',
              }}>
                <p style={{ margin: '0 0 0.4rem', fontWeight: 600 }}>Parcel</p>
                <p style={{ margin: '0 0 0.5rem', opacity: 0.7, fontFamily: 'monospace' }}>
                  {parcel.totalPounds} lb · {parcel.lengthIn}×{parcel.widthIn}×{parcel.heightIn}″
                  {parcel.profileName ? ` — ${parcel.profileName}` : ''}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {parcel.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ opacity: 0.6 }}>
                        {item.quantity > 1 ? `×${item.quantity} ` : ''}{item.title}
                      </span>
                      {item.profileName ? (
                        <span style={{ padding: '0.1rem 0.4rem', borderRadius: '100px', background: '#dcfce7', color: '#166534', fontSize: '0.7rem', fontWeight: 600 }}>
                          {item.profileName}
                        </span>
                      ) : (
                        <span style={{ padding: '0.1rem 0.4rem', borderRadius: '100px', background: '#fee2e2', color: '#991b1b', fontSize: '0.7rem', fontWeight: 600 }}>
                          no profile assigned
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {parcel.usingFallback && (
                  <p style={{ margin: '0.5rem 0 0', color: '#92400e', fontWeight: 500 }}>
                    ⚠ Using fallback dimensions — assign shipping profiles for accurate rates.
                  </p>
                )}
              </div>
            )}

            {/* ── Pitney Bowes ── */}
            <div style={{ marginBottom: '1.25rem' }}>
              {sectionHeading('Pitney Bowes')}
              {pbError && (
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: '#dc2626' }}>Unavailable: {pbError}</p>
              )}
              {pbRates.length === 0 && !pbError && (
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.45 }}>No rates returned.</p>
              )}
              {pbRates.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {pbRates.map(rate => (
                    <label key={rate.id} style={rateRowStyle(isSelectedPB(rate))}>
                      <input
                        type="radio"
                        name="rate"
                        checked={isSelectedPB(rate)}
                        onChange={() => selectPB(rate)}
                        style={{ accentColor: 'var(--foreground)' }}
                      />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>
                          {rate.carrier} — {rate.serviceName}
                          {providerLabel('PB', '#005eb8')}
                        </p>
                        {rate.estimatedDays && (
                          <p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', opacity: 0.5 }}>
                            Est. {rate.estimatedDays} day{rate.estimatedDays === '1' ? '' : 's'}
                            {rate.estimatedDelivery ? ` · by ${rate.estimatedDelivery.split('T')[0]}` : ''}
                          </p>
                        )}
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>${rate.totalCharge.toFixed(2)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* ── Divider ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span style={{ fontSize: '0.7rem', opacity: 0.35, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Shippo</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            {/* ── Shippo ── */}
            <div style={{ marginBottom: '1rem' }}>
              {shippoError && (
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: '#dc2626' }}>Unavailable: {shippoError}</p>
              )}
              {shippoRates.length === 0 && !shippoError && (
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.45 }}>No rates returned.</p>
              )}
              {shippoRates.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {shippoRates.map(rate => (
                    <label key={rate.object_id} style={rateRowStyle(isSelectedShippo(rate))}>
                      <input
                        type="radio"
                        name="rate"
                        checked={isSelectedShippo(rate)}
                        onChange={() => selectShippo(rate)}
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
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>${Number(rate.amount).toFixed(2)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Purchase button */}
            {selected && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button style={btnStyle()} onClick={buyLabel} disabled={purchasing}>
                  {purchasing
                    ? 'Purchasing…'
                    : `Buy via ${selected.source === 'pb' ? 'Pitney Bowes' : 'Shippo'} — $${selected.amount.toFixed(2)}`
                  }
                </button>
                <button style={btnStyle('ghost')} onClick={() => { setShippoRates([]); setPBRates([]); setParcel(null); setSelected(null) }}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {error && (
          <p style={{ margin: '0.75rem 0 0', fontSize: '0.8rem', color: '#dc2626' }}>{error}</p>
        )}
      </div>
    </section>
  )
}
