'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

const productTypes = [
  { label: 'All', slug: null },
  { label: 'Stickers', slug: 'stickers' },
  { label: 'Sticker Packs', slug: 'sticker-packs' },
  { label: 'Prints', slug: 'prints' },
  { label: 'Mini Prints', slug: 'mini-prints' },
  { label: 'Greeting Cards', slug: 'cards' },
]

export const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Name: A → Z', value: 'name_asc' },
  { label: 'Name: Z → A', value: 'name_desc' },
  { label: 'Price: Low → High', value: 'price_asc' },
  { label: 'Price: High → Low', value: 'price_desc' },
]

type SearchResult = {
  handle: string
  title: string
  price: number
  imageUrl: string | null
}

export default function ShopControls({
  activeType,
  activeSort,
  activeCollection,
}: {
  activeType: string | null
  activeSort: string
  activeCollection?: string | null
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setDropdownOpen(false); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data)
      setDropdownOpen(data.length > 0)
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 220)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, search])

  function navigate(type: string | null, sort: string) {
    const params = new URLSearchParams()
    if (type) params.set('type', type)
    if (sort && sort !== 'newest') params.set('sort', sort)
    if (activeCollection) params.set('collection', activeCollection)
    router.push(`/shop${params.toString() ? '?' + params.toString() : ''}`)
  }

  return (
    <div style={{ marginBottom: '2.5rem' }}>

      {/* Type pills + sort */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {productTypes.map((t) => {
          const isActive = t.slug === activeType || (t.slug === null && !activeType)
          return (
            <button
              key={t.slug ?? 'all'}
              onClick={() => navigate(t.slug, activeSort)}
              style={{
                padding: '0.35rem 0.875rem',
                borderRadius: '100px',
                border: `1.5px solid ${isActive ? 'var(--foreground)' : 'var(--border)'}`,
                background: isActive ? 'var(--foreground)' : 'transparent',
                color: isActive ? 'var(--background)' : 'var(--foreground)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.15s',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                opacity: isActive ? 1 : 0.6,
              }}
            >
              {t.label}
            </button>
          )
        })}

        <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
          <select
            value={activeSort}
            onChange={(e) => navigate(activeType, e.target.value)}
            style={{
              padding: '0.35rem 2.25rem 0.35rem 0.75rem',
              borderRadius: '100px',
              border: '1.5px solid var(--border)',
              background: 'var(--background)',
              color: 'var(--foreground)',
              fontSize: '0.75rem',
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              appearance: 'none',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%231a1a1a' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center',
              opacity: 0.6,
            }}
          >
            {sortOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Search input */}
      <div style={{ position: 'relative' }}>
        <svg
          viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75}
          style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, opacity: 0.35, pointerEvents: 'none', zIndex: 1 }}
        >
          <circle cx="8.5" cy="8.5" r="5.5" />
          <line x1="13" y1="13" x2="17.5" y2="17.5" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          placeholder="Search all products…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`)
            if (e.key === 'Escape') { setQuery(''); setDropdownOpen(false) }
          }}
          onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
          onFocus={() => { if (results.length > 0) setDropdownOpen(true) }}
          style={{
            width: '100%',
            padding: '0.65rem 2.25rem 0.65rem 2.375rem',
            borderRadius: '0.75rem',
            border: '1.5px solid var(--border)',
            background: 'var(--muted)',
            fontSize: '0.875rem',
            fontFamily: 'var(--font-sans)',
            color: 'var(--foreground)',
            outline: 'none',
            transition: 'border-color 0.15s, background 0.15s',
          }}
          onFocusCapture={(e) => { e.currentTarget.style.borderColor = 'var(--foreground)'; e.currentTarget.style.background = 'var(--background)' }}
          onBlurCapture={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--muted)' }}
        />

        {query ? (
          <button
            onClick={() => { setQuery(''); setDropdownOpen(false); inputRef.current?.focus() }}
            style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.35, padding: '0.25rem', lineHeight: 1, fontSize: '1.1rem' }}
          >
            ×
          </button>
        ) : searching ? (
          <span style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.3, fontSize: '0.7rem', letterSpacing: '0.05em' }}>
            …
          </span>
        ) : null}

        {/* Autocomplete dropdown */}
        {dropdownOpen && results.length > 0 && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            left: 0,
            right: 0,
            background: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: '1rem',
            boxShadow: '0 16px 48px rgba(0,0,0,0.1)',
            zIndex: 50,
            overflow: 'hidden',
          }}>
            {results.slice(0, 6).map((r, i) => (
              <Link
                key={r.handle}
                href={`/products/${r.handle}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.875rem',
                  padding: '0.75rem 1rem',
                  textDecoration: 'none',
                  color: 'var(--foreground)',
                  borderBottom: i < Math.min(results.length, 6) - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.1s',
                }}
                className="hover:bg-[var(--muted)]"
              >
                <div style={{ width: 44, height: 44, borderRadius: '0.5rem', overflow: 'hidden', background: 'var(--muted)', flexShrink: 0 }}>
                  {r.imageUrl && (
                    <Image src={r.imageUrl} alt={r.title} width={44} height={44} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</p>
                  <p style={{ fontSize: '0.8rem', opacity: 0.45, margin: 0 }}>${r.price.toFixed(2)}</p>
                </div>
                <span style={{ opacity: 0.2, fontSize: '0.9rem', flexShrink: 0 }}>→</span>
              </Link>
            ))}
            <Link
              href={`/search?q=${encodeURIComponent(query.trim())}`}
              style={{ display: 'block', padding: '0.65rem 1rem', fontSize: '0.78rem', fontWeight: 600, opacity: 0.4, textDecoration: 'none', color: 'var(--foreground)', borderTop: '1px solid var(--border)' }}
              className="hover:opacity-100 transition-opacity"
            >
              See all results for "{query}" →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
