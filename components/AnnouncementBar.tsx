'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
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
      }}
    >
      <span style={{ opacity: 0.35, fontFamily: 'var(--font-serif)', fontSize: '0.9rem' }}>✦</span>

      <span>
        Free U.S. shipping on orders{' '}
        <Link
          href="/shop"
          style={{
            color: '#fde8b0',
            fontWeight: 700,
            textDecoration: 'none',
            borderBottom: '1px solid rgba(253,232,176,0.4)',
          }}
        >
          $50+
        </Link>
        {' '}before tax
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
  )
}
