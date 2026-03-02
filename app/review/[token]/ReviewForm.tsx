'use client'

import { useState } from 'react'

interface Props {
  token: string
  defaultName: string
}

export default function ReviewForm({ token, defaultName }: Props) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [name, setName] = useState(defaultName)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { setError('Please select a star rating.'); return }
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, rating, body: body.trim(), customerName: name.trim() }),
      })
      if (!res.ok) {
        const { error: msg } = await res.json()
        throw new Error(msg || 'Something went wrong')
      }
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div style={{
        background: '#f0ede8',
        borderRadius: '1rem',
        padding: '2.5rem',
        textAlign: 'center',
        maxWidth: 480,
        margin: '0 auto',
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎉</div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 400, margin: '0 0 0.75rem' }}>
          Thank you!
        </h2>
        <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.65, lineHeight: 1.7 }}>
          Your review has been submitted and will appear on the site once approved.
        </p>
      </div>
    )
  }

  const activeRating = hover || rating

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 480 }}>

      {/* Star picker */}
      <div>
        <p style={{ margin: '0 0 0.625rem', fontSize: '0.8rem', fontWeight: 500, opacity: 0.6 }}>Your rating</p>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(star)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                fontSize: '2rem',
                lineHeight: 1,
                color: star <= activeRating ? '#ffaaaa' : '#ddd',
                transition: 'color 0.1s',
              }}
              aria-label={`${star} star${star !== 1 ? 's' : ''}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 500, opacity: 0.6 }}>Your name</span>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Jane"
          style={inputStyle}
        />
      </label>

      {/* Review body */}
      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 500, opacity: 0.6 }}>
          Your review <span style={{ opacity: 0.5, fontWeight: 400 }}>(optional)</span>
        </span>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Tell us what you thought…"
          rows={4}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </label>

      {error && (
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#991b1b' }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{
          background: 'var(--foreground)',
          color: 'var(--background)',
          border: 'none',
          padding: '0.75rem 1.75rem',
          borderRadius: '100px',
          fontSize: '0.95rem',
          fontWeight: 600,
          cursor: submitting ? 'not-allowed' : 'pointer',
          opacity: submitting ? 0.6 : 1,
          fontFamily: 'inherit',
          alignSelf: 'flex-start',
        }}
      >
        {submitting ? 'Submitting…' : 'Submit review'}
      </button>
    </form>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '0.6rem 0.875rem',
  borderRadius: '0.5rem',
  border: '1px solid var(--border)',
  background: 'var(--background)',
  fontSize: '0.875rem',
  color: 'var(--foreground)',
  fontFamily: 'inherit',
  width: '100%',
}
