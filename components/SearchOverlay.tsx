'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import AddToCartButton, { type CardVariant } from './AddToCartButton'

type SearchResult = {
  handle: string
  title: string
  price: number
  imageUrl: string | null
  productId: string
  variants: CardVariant[]
  tags: string[]
}

function ResultCard({ r, onClose }: { r: SearchResult; onClose: () => void }) {
  return (
    <div className="group" style={{ color: 'var(--foreground)' }}>
      <div
        style={{
          position: 'relative',
          aspectRatio: '1 / 1',
          background: 'var(--muted)',
          borderRadius: '0.625rem',
          overflow: 'hidden',
          marginBottom: '0.5rem',
        }}
      >
        <Link
          href={`/products/${r.handle}`}
          onClick={onClose}
          className="no-underline"
          style={{ position: 'absolute', inset: 0, display: 'block' }}
          tabIndex={-1}
          aria-hidden
          onFocus={(e) => e.currentTarget.blur()}
        />
        {r.imageUrl ? (
          <Image
            src={r.imageUrl}
            alt={r.title}
            fill
            sizes="140px"
            style={{ objectFit: 'cover', transition: 'transform 0.3s ease', pointerEvents: 'none' }}
            className="group-hover:scale-105"
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0.2, fontSize: '1.5rem', pointerEvents: 'none',
          }}>
            🚀
          </div>
        )}
        {r.variants.length > 0 && (
          <AddToCartButton
            handle={r.handle}
            productId={r.productId}
            title={r.title}
            imageUrl={r.imageUrl}
            tags={r.tags}
            variants={r.variants}
          />
        )}
      </div>
      <Link
        href={`/products/${r.handle}`}
        onClick={onClose}
        className="no-underline"
        style={{ color: 'var(--foreground)' }}
      >
        <p style={{
          fontSize: '0.8rem',
          fontWeight: 500,
          lineHeight: 1.3,
          margin: '0 0 0.15rem',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {r.title}
        </p>
        <p style={{ fontSize: '0.78rem', opacity: 0.5, margin: 0 }}>
          {r.variants.length > 1 ? `From $${r.price.toFixed(2)}` : `$${r.price.toFixed(2)}`}
        </p>
      </Link>
    </div>
  )
}

function ResultGrid({ items, onClose }: { items: SearchResult[]; onClose: () => void }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 140px), 1fr))',
        gap: '0.75rem',
      }}
    >
      {items.map((r) => <ResultCard key={r.handle} r={r} onClose={onClose} />)}
    </div>
  )
}

export default function SearchOverlay({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suggestionsFetchedRef = useRef(false)

  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setResults([])
      return
    }

    setTimeout(() => inputRef.current?.focus(), 50)

    if (suggestionsFetchedRef.current) return
    suggestionsFetchedRef.current = true

    const controller = new AbortController()
    fetch('/api/suggestions', { signal: controller.signal })
      .then(r => r.json())
      .then(setSuggestions)
      .catch(() => { suggestionsFetchedRef.current = false }) // allow retry on error

    return () => controller.abort()
  }, [isOpen])

  // Close on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  async function search(q: string) {
    if (q.length < 2) { setResults([]); setLoading(false); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(q), 280)
  }

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  if (!isOpen) return null

  const hasQuery    = query.length >= 2
  const hasResults  = results.length > 0
  const noResults   = hasQuery && !loading && !hasResults
  const hasPanelContent = hasResults || noResults || (hasQuery && loading)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(26, 26, 26, 0.55)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          animation: 'fadeIn 0.18s ease',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'relative',
          background: 'var(--background)',
          borderBottom: '1px solid var(--border)',
          boxShadow: '0 8px 40px rgba(26,26,26,0.12)',
          animation: 'slideDown 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Search input row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1.25rem 1.5rem',
            borderBottom: hasPanelContent ? '1px solid var(--border)' : 'none',
          }}
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            style={{ width: 20, height: 20, opacity: 0.35, flexShrink: 0 }}
          >
            <circle cx="8.5" cy="8.5" r="5.5" />
            <line x1="13" y1="13" x2="17.5" y2="17.5" />
          </svg>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            placeholder="Search products…"
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
              fontFamily: 'var(--font-serif)',
              color: 'var(--foreground)',
              letterSpacing: '-0.01em',
            }}
          />

          {loading && (
            <div style={{
              width: 16,
              height: 16,
              border: '2px solid var(--border)',
              borderTopColor: 'var(--foreground)',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
              flexShrink: 0,
            }} />
          )}

          <button
            onClick={onClose}
            aria-label="Close search"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              color: 'var(--foreground)',
              opacity: 0.4,
              flexShrink: 0,
              fontFamily: 'inherit',
              fontSize: '0.8rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '0.75rem', letterSpacing: '0.03em', textTransform: 'uppercase' }}>esc</span>
          </button>
        </div>

        {/* Results */}
        {hasResults && (
          <div style={{ overflowY: 'auto', padding: '1.25rem 1.5rem 1.5rem' }}>
            <p style={{
              fontSize: '0.68rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              opacity: 0.35,
              margin: '0 0 1rem',
            }}>
              {results.length} result{results.length !== 1 ? 's' : ''}
            </p>
            <ResultGrid items={results} onClose={onClose} />
            <div style={{ borderTop: '1px solid var(--border)', marginTop: '1.25rem', paddingTop: '1rem' }}>
              <Link
                href={`/search?q=${encodeURIComponent(query)}`}
                onClick={onClose}
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--foreground)',
                  opacity: 0.45,
                  textDecoration: 'none',
                }}
                className="hover:opacity-100 transition-opacity"
              >
                See all results for &ldquo;{query}&rdquo; →
              </Link>
            </div>
          </div>
        )}

        {/* No results + suggestions */}
        {noResults && (
          <div style={{ overflowY: 'auto', padding: '1.25rem 1.5rem 1.5rem' }}>
            <p style={{ fontSize: '0.875rem', opacity: 0.4, marginBottom: suggestions.length > 0 ? '2rem' : 0 }}>
              No results for &ldquo;{query}&rdquo;
            </p>
            {suggestions.length > 0 && (
              <>
                <p style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  opacity: 0.35,
                  margin: '0 0 1rem',
                }}>
                  You might like
                </p>
                <ResultGrid items={suggestions} onClose={onClose} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
