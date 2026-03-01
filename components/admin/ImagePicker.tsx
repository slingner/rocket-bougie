'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { searchProductImages } from '@/app/admin/newsletter/actions'

type ImageResult = {
  url: string
  alt: string
  productTitle: string
}

type Props = {
  onInsert: (url: string) => void
  onClose: () => void
}

export default function ImagePicker({ onInsert, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ImageResult[]>([])
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Load initial images on open
  useEffect(() => {
    searchRef.current?.focus()
    startTransition(async () => {
      const imgs = await searchProductImages('')
      setResults(imgs)
    })
  }, [])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(async () => {
        const imgs = await searchProductImages(query)
        setResults(imgs)
      })
    }, 280)
    return () => clearTimeout(timer)
  }, [query])

  function handleInsert(url: string) {
    onInsert(url)
    // Also copy to clipboard as fallback
    navigator.clipboard.writeText(url).catch(() => {})
    setCopied(url)
    setTimeout(() => setCopied(null), 1800)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,8,6,0.72)',
        backdropFilter: 'blur(3px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--background)',
          borderRadius: '1rem',
          padding: '1.75rem',
          maxWidth: 700,
          width: '100%',
          maxHeight: '82vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 400, margin: 0, letterSpacing: '-0.01em' }}>
              Insert image
            </h2>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', opacity: 0.45 }}>
              Click an image to insert it into the email body
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', opacity: 0.4, padding: '4px 8px', color: 'var(--foreground)', fontFamily: 'inherit' }}
            className="hover:opacity-100"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '1.25rem', flexShrink: 0 }}>
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by product name…"
            style={{
              width: '100%',
              padding: '0.65rem 1rem',
              paddingLeft: '2.25rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border)',
              background: 'var(--muted)',
              fontSize: '0.875rem',
              color: 'var(--foreground)',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.35, fontSize: '0.85rem', pointerEvents: 'none' }}>
            ⌕
          </span>
          {isPending && (
            <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', opacity: 0.45 }}>
              Searching…
            </span>
          )}
        </div>

        {/* Image grid */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {results.length === 0 && !isPending ? (
            <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.4, fontSize: '0.875rem' }}>
              {query ? 'No images found.' : 'No product images yet.'}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '0.625rem',
              }}
            >
              {results.map((img, i) => (
                <button
                  key={`${img.url}-${i}`}
                  type="button"
                  onClick={() => handleInsert(img.url)}
                  title={img.productTitle || img.alt || img.url}
                  style={{
                    position: 'relative',
                    background: 'var(--muted)',
                    border: copied === img.url ? '2px solid #ffaaaa' : '2px solid transparent',
                    borderRadius: '0.5rem',
                    padding: 0,
                    cursor: 'pointer',
                    overflow: 'hidden',
                    aspectRatio: '1',
                    display: 'block',
                    transition: 'border-color 0.15s',
                  }}
                  className="hover:border-[#ffaaaa]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.alt || img.productTitle}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                    loading="lazy"
                  />
                  {copied === img.url && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(255,170,170,0.85)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#1a1a1a',
                    }}>
                      Inserted ✓
                    </div>
                  )}
                  {/* Product title tooltip on hover */}
                  {img.productTitle && (
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.65))',
                      color: '#fff',
                      fontSize: '0.65rem',
                      padding: '12px 6px 5px',
                      lineHeight: 1.3,
                      pointerEvents: 'none',
                    }}>
                      {img.productTitle}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
