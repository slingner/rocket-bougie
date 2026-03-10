'use client'

import { useState, useRef } from 'react'
import { searchProductsWithImages } from '@/app/admin/actions'

type ProductImage = { id: string; url: string; position: number }
type Product = { id: string; title: string; product_images: ProductImage[] }

function Thumb({ url, size }: { url: string | null; size: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '0.35rem', overflow: 'hidden', flexShrink: 0, background: 'var(--border)' }}>
      {url
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2, fontSize: size * 0.4 }}>□</div>
      }
    </div>
  )
}

export default function ThumbnailPicker({
  url,
  onChange,
  label = 'photo',
}: {
  url: string
  onChange: (url: string) => void
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)
  const [expanded, setExpanded] = useState<Product | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleQuery(val: string) {
    setQuery(val)
    setExpanded(null)
    if (timer.current) clearTimeout(timer.current)
    if (!val.trim()) { setResults([]); return }
    setSearching(true)
    timer.current = setTimeout(async () => {
      setResults(await searchProductsWithImages(val))
      setSearching(false)
    }, 280)
  }

  function pick(imgUrl: string) {
    onChange(imgUrl)
    setOpen(false)
    setQuery('')
    setResults([])
    setExpanded(null)
  }

  const inp: React.CSSProperties = {
    padding: '0.55rem 0.75rem',
    borderRadius: '0.5rem',
    border: '1px solid var(--border)',
    background: 'var(--background)',
    fontSize: '0.875rem',
    color: 'var(--foreground)',
    fontFamily: 'inherit',
    width: '100%',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Thumb url={url || null} size={72} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '0.4rem', padding: '0.35rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--foreground)', fontFamily: 'inherit' }}
            className="hover:opacity-70"
          >
            {url ? `Change ${label}` : `Choose ${label}`}
          </button>
          {url && (
            <button
              type="button"
              onClick={() => onChange('')}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '0.4rem', padding: '0.35rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer', color: '#991b1b', fontFamily: 'inherit', opacity: 0.7 }}
              className="hover:opacity-100"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {open && (
        <div style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {!expanded ? (
            <>
              <input
                autoFocus
                value={query}
                onChange={e => handleQuery(e.target.value)}
                style={inp}
                placeholder="Search products…"
              />
              {searching && <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.4 }}>Searching…</p>}
              {!searching && query && results.length === 0 && (
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.4 }}>No products found.</p>
              )}
              {results.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: 280, overflowY: 'auto' }}>
                  {results.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setExpanded(p)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.45rem 0.6rem', border: '1px solid var(--border)', borderRadius: '0.4rem', background: 'var(--muted)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: 'var(--foreground)', width: '100%' }}
                    >
                      <Thumb url={p.product_images[0]?.url ?? null} size={36} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 500, flex: 1 }}>{p.title}</span>
                      <span style={{ fontSize: '0.72rem', opacity: 0.35 }}>
                        {p.product_images.length} photo{p.product_images.length !== 1 ? 's' : ''} →
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setExpanded(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '0.8rem', opacity: 0.5, textAlign: 'left', fontFamily: 'inherit', color: 'var(--foreground)' }}
              >
                ← {expanded.title}
              </button>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {expanded.product_images
                  .slice()
                  .sort((a, b) => a.position - b.position)
                  .map(img => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => pick(img.url)}
                      style={{ width: 80, height: 80, borderRadius: '0.4rem', overflow: 'hidden', border: '2px solid var(--border)', padding: 0, cursor: 'pointer', flexShrink: 0, transition: 'border-color 0.15s' }}
                      className="hover:border-[var(--accent)]"
                      title="Use this photo"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </button>
                  ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
