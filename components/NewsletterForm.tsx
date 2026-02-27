'use client'

import { useState } from 'react'

export default function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // TODO: wire up to email provider
    setDone(true)
  }

  if (done) {
    return (
      <p style={{ fontSize: '0.85rem', opacity: 0.6, margin: 0 }}>
        Thanks! We&apos;ll be in touch. ✨
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
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
        style={{
          padding: '0.6rem',
          borderRadius: '100px',
          background: 'var(--accent)',
          color: 'var(--foreground)',
          border: 'none',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
        }}
      >
        Subscribe
      </button>
    </form>
  )
}
