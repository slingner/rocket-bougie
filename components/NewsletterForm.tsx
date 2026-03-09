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
      <p style={{ fontSize: '0.875rem', opacity: 0.6, margin: 0, lineHeight: 1.5 }}>
        Thanks! Check your inbox for your 10% off code. ✨
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <style>{`
        .nl-form { display: flex; flex-direction: column; gap: 0.5rem; }
        .nl-offer {
          font-size: 0.8rem; font-weight: 600;
          color: var(--foreground); margin: 0 0 0.35rem; opacity: 0.75;
        }
        .nl-row { display: contents; }
        .nl-input {
          padding: 0.6rem 0.875rem;
          border-radius: 0.5rem;
          border: 1px solid var(--border);
          background: var(--background);
          font-size: 0.875rem;
          font-family: var(--font-sans);
          color: var(--foreground);
          outline: none;
          width: 100%;
          box-sizing: border-box;
        }
        .nl-btn {
          padding: 0.75rem;
          border-radius: 0.625rem;
          background: var(--accent);
          color: var(--foreground);
          border: 1.5px solid var(--accent-border);
          font-size: 0.8rem;
          font-weight: 600;
          font-family: var(--font-sans);
          cursor: pointer;
          white-space: nowrap;
        }
        .nl-btn:disabled { cursor: not-allowed; opacity: 0.7; }
        @media (max-width: 720px) {
          .nl-offer { text-align: center; font-size: 0.82rem; margin: 0 0 0.25rem; }
          .nl-row {
            display: flex; gap: 0.5rem;
          }
          .nl-input {
            flex: 1; min-width: 0;
            padding: 0.7rem 0.875rem;
            border-radius: 0.625rem;
          }
          .nl-btn {
            padding: 0.7rem 1.25rem;
            border-radius: 0.625rem;
          }
        }
      `}</style>
      <div className="nl-form">
        <p className="nl-offer">
          Get 10% off your first order when you subscribe.
        </p>
        <label htmlFor="newsletter-email" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>
          Email address
        </label>
        <div className="nl-row">
          <input
            id="newsletter-email"
            className="nl-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            disabled={isPending}
          />
          <button
            type="submit"
            disabled={isPending}
            className="nl-btn"
          >
            {isPending ? 'Subscribing…' : 'Subscribe'}
          </button>
        </div>
        {error && (
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#991b1b' }}>{error}</p>
        )}
      </div>
    </form>
  )
}
