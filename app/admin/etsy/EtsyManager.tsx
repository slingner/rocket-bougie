'use client'

import { useState, useTransition, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { importEtsyListing, linkProductToEtsyListing, syncProductToEtsy, pullFromEtsy } from './actions'
import { etsyPriceToDecimal } from '@/lib/etsy-utils'
import type { EtsyListing } from '@/lib/etsy-utils'

type LocalProduct = { id: string; title: string; handle: string }

interface Props {
  listings: EtsyListing[]
  linkedMap: Record<string, LocalProduct>
  unlinkedProducts: LocalProduct[]
}

function guessMatch(etsyTitle: string, products: LocalProduct[]): LocalProduct | null {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean)
  const etsyWords = normalize(etsyTitle)
  let best: LocalProduct | null = null
  let bestScore = 0
  for (const p of products) {
    const pWords = normalize(p.title)
    // A word "matches" if either contains the other (handles plurals, abbreviations)
    const matches = etsyWords.filter((ew) =>
      pWords.some((pw) => pw.includes(ew) || ew.includes(pw))
    ).length
    const score = matches / Math.max(etsyWords.length, pWords.length)
    if (score > bestScore) { bestScore = score; best = p }
  }
  return bestScore >= 0.2 ? best : null
}

export default function EtsyManager({ listings, linkedMap, unlinkedProducts }: Props) {
  if (listings.length === 0) {
    return <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>No active Etsy listings found.</p>
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
      <thead>
        <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
          <th style={thStyle(56)}></th>
          <th style={thStyle()}>Etsy listing</th>
          <th style={thStyle(70)}>Price</th>
          <th style={thStyle()}>Your site</th>
          <th style={thStyle(220)}>Sync</th>
        </tr>
      </thead>
      <tbody>
        {listings.map((listing) => (
          <EtsyRow
            key={listing.listing_id}
            listing={listing}
            linkedProduct={linkedMap[String(listing.listing_id)] ?? null}
            unlinkedProducts={unlinkedProducts}
          />
        ))}
      </tbody>
    </table>
  )
}

function EtsyRow({
  listing,
  linkedProduct,
  unlinkedProducts,
}: {
  listing: EtsyListing
  linkedProduct: LocalProduct | null
  unlinkedProducts: LocalProduct[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'ok' | 'error'>('ok')
  const [showLink, setShowLink] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<LocalProduct | null>(null)
  const [localLinked, setLocalLinked] = useState(linkedProduct)

  const thumb = listing.images?.[0]?.url_570xN
  const price = listing.price ? etsyPriceToDecimal(listing.price).toFixed(2) : '—'
  const suggested = showLink ? guessMatch(listing.title, unlinkedProducts) : null

  function flash(msg: string, type: 'ok' | 'error') {
    setMessage(msg); setMessageType(type)
    setTimeout(() => setMessage(''), 4000)
  }

  function handleImport() {
    startTransition(async () => {
      const r = await importEtsyListing(String(listing.listing_id))
      r.ok ? (flash('Imported as new product', 'ok'), router.refresh()) : flash(r.error, 'error')
    })
  }

  function handlePushToEtsy() {
    if (!localLinked) return
    startTransition(async () => {
      const r = await syncProductToEtsy(localLinked.id)
      r.ok ? flash('Etsy listing updated', 'ok') : flash(r.error, 'error')
    })
  }

  function handlePullFromEtsy() {
    if (!localLinked) return
    startTransition(async () => {
      const r = await pullFromEtsy(localLinked.id)
      r.ok ? (flash('Site product updated', 'ok'), router.refresh()) : flash(r.error, 'error')
    })
  }

  function handleLink(product: LocalProduct) {
    startTransition(async () => {
      const r = await linkProductToEtsyListing(product.id, String(listing.listing_id))
      if (r.ok) {
        setLocalLinked(product); setShowLink(false)
        flash('Linked', 'ok'); router.refresh()
      } else {
        flash(r.error, 'error')
      }
    })
  }

  return (
    <tr style={{ borderBottom: '1px solid var(--border)', opacity: isPending ? 0.5 : 1, transition: 'opacity 0.15s' }}>

      {/* Thumbnail */}
      <td style={{ padding: '0.75rem 0.75rem 0.75rem 0' }}>
        {thumb
          ? <img src={thumb} alt="" width={40} height={40} style={{ objectFit: 'cover', borderRadius: 4, display: 'block' }} /> // eslint-disable-line @next/next/no-img-element
          : <div style={{ width: 40, height: 40, background: 'var(--muted)', borderRadius: 4 }} />}
      </td>

      {/* Etsy listing */}
      <td style={{ padding: '0.75rem 1rem 0.75rem 0', verticalAlign: 'top' }}>
        <a href={listing.url} target="_blank" rel="noopener noreferrer"
          style={{ color: 'inherit', fontWeight: 500, textDecoration: 'none', lineHeight: 1.3 }}
          className="hover:underline">
          {listing.title}
        </a>
        <div style={{ fontSize: '0.7rem', opacity: 0.35, marginTop: 3 }}>ID {listing.listing_id}</div>
      </td>

      {/* Price */}
      <td style={{ padding: '0.75rem 1rem 0.75rem 0', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
        ${price}
      </td>

      {/* Your site — linked product name, or link/import controls */}
      <td style={{ padding: '0.75rem 1rem 0.75rem 0', verticalAlign: 'top' }}>
        {localLinked ? (
          <Link href={`/admin/products/${localLinked.id}`}
            style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}
            className="hover:underline">
            {localLinked.title}
          </Link>
        ) : showLink ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {suggested && !selectedProduct && (
              <div style={{
                fontSize: '0.75rem', padding: '0.35rem 0.5rem',
                background: 'rgba(22,101,52,0.06)', border: '1px solid rgba(22,101,52,0.18)',
                borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem',
              }}>
                <span style={{ opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                  {suggested.title}
                </span>
                <div style={{ display: 'flex', gap: '0.2rem', flexShrink: 0 }}>
                  <button onClick={() => handleLink(suggested)} disabled={isPending}
                    style={{ ...ghostBtn, color: '#166534', borderColor: 'rgba(22,101,52,0.3)' }}>
                    Link
                  </button>
                  <button onClick={() => setSelectedProduct({ id: '__search__', title: '', handle: '' })}
                    style={{ ...ghostBtn, opacity: 0.45, border: 'none' }}>
                    Other
                  </button>
                </div>
              </div>
            )}
            {(!suggested || selectedProduct?.id === '__search__') && (
              <ProductAutocomplete products={unlinkedProducts} onSelect={handleLink} disabled={isPending} />
            )}
            <button onClick={() => { setShowLink(false); setSelectedProduct(null) }}
              style={{ ...ghostBtn, border: 'none', opacity: 0.35, padding: '0.1rem 0', fontSize: '0.7rem' }}>
              Cancel
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <button onClick={() => { setShowLink(true); setSelectedProduct(null) }}
              disabled={isPending}
              style={{ ...ghostBtn, border: '1px dashed var(--border)' }}>
              Link to existing product
            </button>
          </div>
        )}
      </td>

      {/* Sync actions */}
      <td style={{ padding: '0.75rem 0 0.75rem 0', verticalAlign: 'top' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {message && (
            <span style={{ fontSize: '0.73rem', color: messageType === 'error' ? '#dc2626' : '#166534' }}>
              {message}
            </span>
          )}

          {localLinked ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <button onClick={handlePullFromEtsy} disabled={isPending} style={syncBtn}>
                <span style={syncLabel('etsy')}>Etsy</span>
                <span style={syncArrow}>→</span>
                <span style={syncLabel('site')}>this site</span>
              </button>
              <button onClick={handlePushToEtsy} disabled={isPending} style={syncBtn}>
                <span style={syncLabel('site')}>this site</span>
                <span style={syncArrow}>→</span>
                <span style={syncLabel('etsy')}>Etsy</span>
              </button>
            </div>
          ) : !showLink ? (
            <button onClick={handleImport} disabled={isPending} style={importBtn}>
              {isPending ? 'Importing…' : 'Import as new product'}
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  )
}

function ProductAutocomplete({ products, onSelect, disabled }: {
  products: LocalProduct[]
  onSelect: (p: LocalProduct) => void
  disabled: boolean
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(true)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q
      ? products.filter((p) => p.title.toLowerCase().includes(q)).slice(0, 8)
      : products.slice(0, 8)
  }, [query, products])

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        type="text" value={query} autoFocus disabled={disabled}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Search your products…"
        style={{
          width: '100%', fontSize: '0.775rem', padding: '0.3rem 0.5rem',
          border: '1px solid var(--border)', borderRadius: 4,
          background: 'var(--background)', color: 'var(--foreground)',
          outline: 'none', boxSizing: 'border-box',
        }}
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'var(--background)', border: '1px solid var(--border)',
          borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 50, maxHeight: 200, overflowY: 'auto',
        }}>
          {filtered.map((p) => (
            <button key={p.id}
              onMouseDown={(e) => { e.preventDefault(); onSelect(p); setOpen(false) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '0.4rem 0.6rem', fontSize: '0.775rem',
                background: 'transparent', border: 'none',
                cursor: 'pointer', color: 'var(--foreground)', fontFamily: 'inherit',
              }}
              className="hover:bg-[var(--muted)]">
              {p.title}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// — Styles —

function thStyle(width?: number): React.CSSProperties {
  return {
    padding: '0.5rem 1rem 0.5rem 0',
    fontWeight: 500, fontSize: '0.75rem',
    opacity: 0.45, textTransform: 'uppercase', letterSpacing: '0.06em',
    ...(width ? { width } : {}),
  }
}

const ghostBtn: React.CSSProperties = {
  fontSize: '0.75rem', padding: '0.25rem 0.5rem',
  border: '1px solid var(--border)', borderRadius: 4,
  background: 'transparent', cursor: 'pointer',
  fontFamily: 'inherit', color: 'var(--foreground)', whiteSpace: 'nowrap',
}

const importBtn: React.CSSProperties = {
  fontSize: '0.775rem', padding: '0.3rem 0.625rem',
  border: '1px solid var(--border)', borderRadius: 4,
  background: 'transparent', cursor: 'pointer',
  fontFamily: 'inherit', color: 'var(--foreground)', whiteSpace: 'nowrap',
}

const syncBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '0.3rem',
  padding: '0.3rem 0.6rem', border: '1px solid var(--border)',
  borderRadius: 4, background: 'transparent',
  cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
  fontSize: '0.75rem', textAlign: 'left', width: '100%',
}

const syncArrow: React.CSSProperties = {
  opacity: 0.4, fontSize: '0.8rem', flexShrink: 0,
}

function syncLabel(source: 'etsy' | 'site'): React.CSSProperties {
  return {
    fontWeight: 600,
    color: source === 'etsy' ? '#F1641E' : 'var(--foreground)',
    fontSize: '0.72rem',
    letterSpacing: '0.02em',
    textTransform: source === 'etsy' ? 'none' : 'none',
  }
}
