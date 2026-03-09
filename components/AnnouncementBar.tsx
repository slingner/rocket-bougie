'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  if (dismissed) return null

  return (
    <div style={{
      maxHeight: scrolled ? 0 : '4rem',
      overflow: 'hidden',
      transition: 'max-height 0.35s ease',
    }}>
      <div
        style={{
          background: '#b5533c',
          color: '#fdf6f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '0.55rem 1.5rem',
          fontSize: '0.78rem',
          fontWeight: 500,
          letterSpacing: '0.02em',
          position: 'relative',
          opacity: scrolled ? 0 : 1,
          transition: 'opacity 0.2s ease',
        }}
      >
        <span style={{ opacity: 0.35, fontFamily: 'var(--font-serif)', fontSize: '0.9rem' }}>✦</span>

        <span>
          Free shipping on US orders over{' '}
          <Link
            href="/shop"
            style={{
              color: '#fde8b0',
              fontWeight: 700,
              textDecoration: 'none',
              borderBottom: '1px solid rgba(253,232,176,0.4)',
            }}
          >
            $50
          </Link>
        </span>

        <span style={{ opacity: 0.35, fontFamily: 'var(--font-serif)', fontSize: '0.9rem' }}>✦</span>

        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          style={{
            position: 'absolute',
            right: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#fdf6f0',
            opacity: 0.5,
            padding: '0.25rem',
            lineHeight: 1,
            fontSize: '1rem',
            fontFamily: 'inherit',
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
}
