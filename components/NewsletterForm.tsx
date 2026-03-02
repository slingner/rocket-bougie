'use client'

import { useState, useTransition } from 'react'
import { publicSubscribe } from '@/app/admin/newsletter/actions'

export default function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        await publicSubscribe(email.trim())
        setDone(true)
      } catch {
        setError('Something went wrong. Please try again.')
      }
    })
  }

  if (done) {
    return (
      <p style={{ fontSize: '0.85rem', opacity: 0.6, margin: 0 }}>
        Thanks! Check your inbox for your 10% off code. ✨
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground)', margin: '0 0 0.35rem', opacity: 0.75 }}>
        Get 10% off your first order when you subscribe.
      </p>
      <label htmlFor="newsletter-email" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        disabled={isPending}
        style={{
          padding: '0.6rem 0.875rem',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)',
          background: 'var(--background)',
          fontSize: '0.875rem',
          fontFamily: 'var(--font-sans)',
          color: 'var(--foreground)',
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
      <button
        type="submit"
        disabled={isPending}
        style={{
          padding: '0.75rem',
          borderRadius: '100px',
          background: 'var(--accent)',
          color: 'var(--foreground)',
          border: '1.5px solid var(--accent-border)',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: isPending ? 'not-allowed' : 'pointer',
          opacity: isPending ? 0.7 : 1,
          fontFamily: 'var(--font-sans)',
        }}
      >
        {isPending ? 'Subscribing…' : 'Subscribe'}
      </button>
      {error && (
        <p style={{ margin: 0, fontSize: '0.78rem', color: '#991b1b' }}>{error}</p>
      )}
    </form>
  )
}
