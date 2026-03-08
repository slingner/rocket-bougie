'use client'

import { useState } from 'react'

export default function SubscribeButton() {
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
    <div>
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="subscribe-btn"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.625rem',
          background: 'var(--foreground)',
          color: 'var(--background)',
          padding: '1rem 2.25rem',
          borderRadius: '100px',
          fontSize: '1rem',
          fontWeight: 600,
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          opacity: loading ? 0.6 : 1,
          transition: 'transform 0.15s, opacity 0.15s',
          letterSpacing: '-0.01em',
        }}
      >
        {loading ? 'Redirecting…' : (
          <>
            Subscribe — $9 / month
            <span style={{ fontSize: '1.1rem', marginLeft: '0.125rem' }}>→</span>
          </>
        )}
      </button>
      {error && (
        <p style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.75rem' }}>{error}</p>
      )}
      <style>{`
        .subscribe-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          opacity: 0.9;
        }
      `}</style>
    </div>
  )
}
