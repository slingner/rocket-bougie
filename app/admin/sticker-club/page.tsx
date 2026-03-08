'use client'

import { useState } from 'react'

export default function StickerClubAdminPage() {
  const [code, setCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alreadyExisted, setAlreadyExisted] = useState(false)
  const [copied, setCopied] = useState(false)

  async function generate() {
    setLoading(true)
    setError(null)
    setCode(null)
    setCopied(false)
    try {
      const res = await fetch('/api/admin/sticker-club/coupon', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
      setCode(data.code)
      setAlreadyExisted(data.alreadyExisted)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function copy() {
    if (!code) return
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const now = new Date()
  const monthLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 0.375rem', letterSpacing: '-0.02em' }}>
        Sticker Club
      </h1>
      <p style={{ fontSize: '0.875rem', opacity: 0.5, margin: '0 0 2.5rem' }}>
        Generate the monthly discount code to include in the letter.
      </p>

      <div style={{
        border: '1px solid var(--border)',
        borderRadius: '1rem',
        padding: '2rem',
        background: 'var(--background)',
      }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.4, margin: '0 0 0.5rem' }}>
          {monthLabel}
        </p>
        <p style={{ fontSize: '0.875rem', opacity: 0.6, margin: '0 0 1.5rem', lineHeight: 1.6 }}>
          Generates a code for 10% off, good for 40 days. Safe to click more than once — if this month&apos;s code already exists it will just show it again.
        </p>

        <button
          onClick={generate}
          disabled={loading}
          style={{
            background: 'var(--foreground)',
            color: 'var(--background)',
            border: 'none',
            borderRadius: '0.625rem',
            padding: '0.75rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            fontFamily: 'inherit',
          }}
        >
          {loading ? 'Generating…' : `Get ${monthLabel} code`}
        </button>

        {error && (
          <p style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '1rem' }}>{error}</p>
        )}

        {code && (
          <div style={{ marginTop: '1.75rem' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.4, margin: '0 0 0.625rem' }}>
              {alreadyExisted ? 'Already generated this month' : 'Your code'}
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              <span style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '2.25rem',
                letterSpacing: '0.05em',
                lineHeight: 1,
              }}>
                {code}
              </span>
              <button
                onClick={copy}
                style={{
                  background: copied ? 'var(--muted)' : 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  padding: '0.375rem 0.875rem',
                  fontSize: '0.775rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  color: 'var(--foreground)',
                  transition: 'background 0.15s',
                }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', opacity: 0.45, margin: '0.75rem 0 0', lineHeight: 1.5 }}>
              Write this in the letter. It expires after 40 days so subscribers have time to use it after the pack arrives.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
