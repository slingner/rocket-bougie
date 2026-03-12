'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Nav from '@/components/Nav'
import { createClient } from '@/lib/supabase/client'

export default function RegisterForm() {
  const searchParams = useSearchParams()
  const prefillEmail = searchParams.get('email') ?? ''

  const [email, setEmail] = useState(prefillEmail)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <>
        <Nav />
        <main style={{ maxWidth: 460, margin: '3rem auto', padding: '0 1.5rem 6rem', textAlign: 'center' }}>
          <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📬</p>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2rem',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            margin: '0 0 0.75rem',
          }}>
            Check your email
          </h1>
          <p style={{ opacity: 0.6, fontSize: '0.9rem', lineHeight: 1.6 }}>
            We sent a confirmation link to <strong>{email}</strong>.
            Click it to activate your account.
          </p>
        </main>
      </>
    )
  }

  return (
    <>
      <Nav />
      <main style={{ maxWidth: 460, margin: '3rem auto', padding: '0 1.5rem 6rem', minHeight: '600px' }}>

        {/* Tab switcher */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: '#ede9e3',
          borderRadius: '100px',
          padding: '4px',
          marginBottom: '2rem',
        }}>
          <Link href="/account/login" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.65rem 1rem',
            borderRadius: '100px',
            fontSize: '0.9rem',
            fontWeight: 500,
            fontFamily: 'var(--font-sans)',
            color: 'var(--foreground)',
            opacity: 0.5,
            textDecoration: 'none',
            transition: 'opacity 0.15s',
          }}>
            Sign in
          </Link>
          <span style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.65rem 1rem',
            borderRadius: '100px',
            background: 'var(--accent)',
            border: '1.5px solid #f09090',
            fontSize: '0.9rem',
            fontWeight: 600,
            fontFamily: 'var(--font-sans)',
            color: 'var(--foreground)',
            userSelect: 'none',
          }}>
            Create account
          </span>
        </div>

        {/* Heading */}
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '2rem',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          margin: '0 0 1.75rem',
        }}>
          Create your account
        </h1>

        {/* Google button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.625rem',
            width: '100%',
            padding: '0.875rem',
            borderRadius: '100px',
            border: '1.5px solid var(--border)',
            background: 'white',
            fontSize: '0.95rem',
            fontWeight: 500,
            cursor: googleLoading ? 'wait' : 'pointer',
            opacity: googleLoading ? 0.6 : 1,
            fontFamily: 'var(--font-sans)',
            color: 'var(--foreground)',
            marginBottom: '1.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            transition: 'box-shadow 0.15s, border-color 0.15s',
          }}
        >
          <GoogleIcon />
          {googleLoading ? 'Redirecting…' : 'Continue with Google'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: '0.75rem', opacity: 0.4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <p style={{
              background: '#fee2e2',
              color: '#991b1b',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              margin: 0,
            }}>
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
              autoComplete="new-password"
              minLength={8}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, opacity: 0.6 }}>Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.25rem',
              padding: '0.875rem',
              borderRadius: '100px',
              background: 'var(--accent)',
              color: 'var(--foreground)',
              border: '1.5px solid #f09090',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
              fontFamily: 'var(--font-sans)',
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </main>
    </>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  borderRadius: '0.625rem',
  border: '1px solid var(--border)',
  background: 'white',
  fontSize: '1rem',
  fontFamily: 'var(--font-sans)',
  color: 'var(--foreground)',
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
}
