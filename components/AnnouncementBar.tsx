'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div
      style={{
        background: 'var(--foreground)',
        color: 'var(--background)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '0.55rem 1.5rem',
        fontSize: '0.78rem',
        fontWeight: 500,
        letterSpacing: '0.02em',
        position: 'relative',
      }}
    >
      {/* Decorative dots */}
      <span style={{ opacity: 0.35, fontFamily: 'var(--font-serif)', fontSize: '0.9rem' }}>✦</span>

      <span>
        Free shipping on US orders over{' '}
        <Link
          href="/shop"
          style={{
            color: 'var(--accent)',
            fontWeight: 700,
            textDecoration: 'none',
            borderBottom: '1px solid rgba(234,162,33,0.4)',
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
          color: 'var(--background)',
          opacity: 0.4,
          padding: '0.25rem',
          lineHeight: 1,
          fontSize: '1rem',
          fontFamily: 'inherit',
        }}
      >
        ×
      </button>
    </div>
  )
}
