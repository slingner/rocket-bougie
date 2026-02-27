'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Nav from '@/components/Nav'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/account'
  const confirmationError = searchParams.get('error') === 'confirmation_failed'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(confirmationError ? 'Email confirmation failed. Try again or contact us.' : null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(redirect)
    router.refresh()
  }

  return (
    <>
      <Nav />
      <main style={{ maxWidth: 440, margin: '4rem auto', padding: '0 1.5rem 6rem' }}>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2rem',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            margin: '0 0 0.5rem',
          }}
        >
          Sign in
        </h1>
        <p style={{ opacity: 0.5, fontSize: '0.875rem', margin: '0 0 2rem' }}>
          Don&apos;t have an account?{' '}
          <Link href="/account/register" style={{ color: 'inherit', fontWeight: 500 }}>
            Create one
          </Link>
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <p
              style={{
                background: '#fee2e2',
                color: '#991b1b',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                margin: 0,
              }}
            >
              {error}
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, opacity: 0.6 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, opacity: 0.6 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              padding: '0.875rem',
              borderRadius: '100px',
              background: 'var(--accent)',
              color: 'var(--foreground)',
              border: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
              fontFamily: 'var(--font-sans)',
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </main>
    </>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  borderRadius: '0.625rem',
  border: '1px solid var(--border)',
  background: 'var(--background)',
  fontSize: '1rem',
  fontFamily: 'var(--font-sans)',
  color: 'var(--foreground)',
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
}
