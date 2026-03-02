'use client'

import { useState } from 'react'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  fontSize: '0.9rem',
  border: '1px solid var(--border)',
  borderRadius: '0.625rem',
  background: 'var(--background)',
  color: 'var(--foreground)',
  fontFamily: 'var(--font-sans)',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  marginBottom: '0.4rem',
  opacity: 0.6,
}

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')

    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    setStatus(res.ok ? 'sent' : 'error')
  }

  if (status === 'sent') {
    return (
      <div
        style={{
          background: 'var(--muted)',
          borderRadius: '1rem',
          padding: '2.5rem',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>✉️</p>
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.4rem',
            letterSpacing: '-0.01em',
            margin: '0 0 0.5rem',
          }}
        >
          Message sent!
        </p>
        <p style={{ fontSize: '0.9rem', opacity: 0.6, margin: 0 }}>
          We&apos;ll get back to you within 1–2 business days.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label htmlFor="name" style={labelStyle}>Name</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="email" style={labelStyle}>Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label htmlFor="subject" style={labelStyle}>Subject</label>
        <select
          id="subject"
          name="subject"
          value={form.subject}
          onChange={handleChange}
          style={inputStyle}
        >
          <option value="">Select a topic…</option>
          <option value="Order question">Order question</option>
          <option value="Wholesale inquiry">Wholesale inquiry</option>
          <option value="Event or collaboration">Event or collaboration</option>
          <option value="Something else">Something else</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" style={labelStyle}>Message</label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          value={form.message}
          onChange={handleChange}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
        />
      </div>

      {status === 'error' && (
        <p style={{ fontSize: '0.875rem', color: '#c0392b', margin: 0 }}>
          Something went wrong — please try again or email us directly.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        style={{
          alignSelf: 'flex-start',
          background: 'var(--foreground)',
          color: 'var(--background)',
          padding: '0.875rem 2rem',
          borderRadius: '100px',
          fontSize: '0.95rem',
          fontWeight: 600,
          border: 'none',
          cursor: status === 'sending' ? 'default' : 'pointer',
          opacity: status === 'sending' ? 0.6 : 1,
          fontFamily: 'var(--font-sans)',
          transition: 'opacity 0.15s',
        }}
      >
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
