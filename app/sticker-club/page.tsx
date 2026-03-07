'use client'

import { useState } from 'react'

export default function StickerClubPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubscribe() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/subscribe', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
      <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.4, marginBottom: '1rem' }}>
        Monthly Subscription
      </p>

      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(2.5rem, 6vw, 3.5rem)',
          fontWeight: 400,
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
          margin: '0 0 1.25rem',
        }}
      >
        Sticker Club
      </h1>

      <p style={{ fontSize: '1.125rem', opacity: 0.65, lineHeight: 1.6, marginBottom: '2.5rem' }}>
        Every month, a curated pack of Rocket Boogie stickers shows up at your door.
        New designs, small-batch prints, and the occasional surprise. Cancel any time.
      </p>

      <div
        style={{
          display: 'inline-block',
          background: 'var(--muted)',
          borderRadius: '1rem',
          padding: '2rem 2.5rem',
          marginBottom: '2.5rem',
          minWidth: 260,
        }}
      >
        <div style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', letterSpacing: '-0.03em', lineHeight: 1 }}>
          $15
        </div>
        <div style={{ opacity: 0.5, fontSize: '0.875rem', marginTop: '0.35rem' }}>per month · billed monthly</div>

        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: '1.5rem 0 0',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            fontSize: '0.9rem',
          }}
        >
          {[
            '3–5 stickers per month',
            'Free shipping (US)',
            'New designs every month',
            'Cancel any time',
          ].map(item => (
            <li key={item} style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
              <span style={{ color: 'var(--accent)', flexShrink: 0 }}>✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {error && (
        <p style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>
      )}

      <div>
        <button
          onClick={handleSubscribe}
          disabled={loading}
          style={{
            background: 'var(--foreground)',
            color: 'var(--background)',
            padding: '0.9rem 2.5rem',
            borderRadius: '0.625rem',
            fontSize: '1rem',
            fontWeight: 600,
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            opacity: loading ? 0.6 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {loading ? 'Redirecting…' : 'Subscribe — $15/mo'}
        </button>
      </div>

      <p style={{ fontSize: '0.8rem', opacity: 0.4, marginTop: '1.25rem' }}>
        Secure checkout via Stripe. Cancel any time from your account.
      </p>
    </main>
  )
}
