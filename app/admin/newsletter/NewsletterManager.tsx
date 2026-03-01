'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { addSubscriber, deleteSubscriber } from './actions'

type Subscriber = {
  id: string
  email: string
  name: string | null
  status: string
  source: string | null
  subscribed_at: string
  unsubscribed_at: string | null
}

type Campaign = {
  id: string
  subject: string
  status: string
  sent_at: string | null
  recipient_count: number | null
  created_at: string
}

export default function NewsletterManager({
  subscribers: initialSubscribers,
  campaigns,
}: {
  subscribers: Subscriber[]
  campaigns: Campaign[]
}) {
  const [subscribers, setSubscribers] = useState(initialSubscribers)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addEmail, setAddEmail] = useState('')
  const [addName, setAddName] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const activeCount = subscribers.filter(s => s.status === 'subscribed').length

  function handleAdd() {
    setAddError(null)
    if (!addEmail.trim() || !addEmail.includes('@')) {
      setAddError('Enter a valid email address')
      return
    }
    startTransition(async () => {
      try {
        await addSubscriber(addEmail.trim(), addName.trim() || undefined)
        setSubscribers(prev => {
          const exists = prev.find(s => s.email === addEmail.toLowerCase().trim())
          if (exists) return prev.map(s => s.email === addEmail.toLowerCase().trim() ? { ...s, status: 'subscribed' } : s)
          return [{
            id: crypto.randomUUID(),
            email: addEmail.toLowerCase().trim(),
            name: addName.trim() || null,
            status: 'subscribed',
            source: 'admin',
            subscribed_at: new Date().toISOString(),
            unsubscribed_at: null,
          }, ...prev]
        })
        setAddEmail('')
        setAddName('')
        setShowAddForm(false)
      } catch (e) {
        setAddError(e instanceof Error ? e.message : 'Failed to add subscriber')
      }
    })
  }

  function handleDelete(id: string, email: string) {
    if (!confirm(`Remove ${email} from subscribers?`)) return
    setSubscribers(prev => prev.filter(s => s.id !== id))
    startTransition(async () => { await deleteSubscriber(id) })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

      {/* ── Subscribers ── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.4, margin: 0 }}>
            Subscribers — {activeCount} active
          </h2>
          {!showAddForm && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              style={btnPrimary}
            >
              + Add subscriber
            </button>
          )}
        </div>

        {showAddForm && (
          <div style={{ background: 'var(--muted)', borderRadius: '0.875rem', padding: '1.25rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <label style={labelStyle}>
                <span style={labelText}>Email</span>
                <input
                  type="email"
                  value={addEmail}
                  onChange={e => setAddEmail(e.target.value)}
                  placeholder="hello@example.com"
                  style={{ ...inputStyle, minWidth: 220 }}
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                />
              </label>
              <label style={labelStyle}>
                <span style={labelText}>Name (optional)</span>
                <input
                  type="text"
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                  placeholder="Jane Smith"
                  style={{ ...inputStyle, minWidth: 160 }}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                />
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" onClick={handleAdd} disabled={isPending} style={btnPrimary}>
                  {isPending ? 'Adding…' : 'Add'}
                </button>
                <button type="button" onClick={() => { setShowAddForm(false); setAddEmail(''); setAddName(''); setAddError(null) }} style={btnSecondary}>
                  Cancel
                </button>
              </div>
            </div>
            {addError && <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#991b1b' }}>{addError}</p>}
          </div>
        )}

        {subscribers.length === 0 ? (
          <div style={{ background: 'var(--muted)', borderRadius: '0.875rem', padding: '3rem', textAlign: 'center', opacity: 0.5 }}>
            No subscribers yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Email', 'Name', 'Source', 'Status', 'Subscribed', ''].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s, i) => (
                  <tr
                    key={s.id}
                    style={{ borderBottom: i < subscribers.length - 1 ? '1px solid var(--border)' : 'none', opacity: s.status === 'unsubscribed' ? 0.45 : 1 }}
                    className="hover:bg-[var(--muted)] transition-colors"
                  >
                    <td style={{ padding: '0.75rem 0.875rem' }}>{s.email}</td>
                    <td style={{ padding: '0.75rem 0.875rem', opacity: 0.6 }}>{s.name || '—'}</td>
                    <td style={{ padding: '0.75rem 0.875rem', opacity: 0.5, fontSize: '0.8rem' }}>{s.source || 'signup_form'}</td>
                    <td style={{ padding: '0.75rem 0.875rem' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '0.15rem 0.55rem',
                        borderRadius: '100px',
                        background: s.status === 'subscribed' ? '#dcfce7' : 'var(--border)',
                        color: s.status === 'subscribed' ? '#166534' : 'var(--foreground)',
                      }}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 0.875rem', opacity: 0.5, whiteSpace: 'nowrap' }}>
                      {new Date(s.subscribed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '0.75rem 0.875rem', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleDelete(s.id, s.email)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', opacity: 0.4, padding: 0, fontFamily: 'inherit', color: 'var(--foreground)' }}
                        className="hover:opacity-100"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Campaigns ── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.4, margin: 0 }}>
            Campaigns
          </h2>
          <Link
            href="/admin/newsletter/campaigns/new"
            style={{
              ...btnPrimary,
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            + New campaign
          </Link>
        </div>

        {campaigns.length === 0 ? (
          <div style={{ background: 'var(--muted)', borderRadius: '0.875rem', padding: '3rem', textAlign: 'center', opacity: 0.5 }}>
            No campaigns yet.
          </div>
        ) : (
          <div style={{ background: 'var(--muted)', borderRadius: '0.875rem', overflow: 'hidden' }}>
            {campaigns.map((c, i) => (
              <Link
                key={c.id}
                href={`/admin/newsletter/campaigns/${c.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 1.25rem',
                  borderBottom: i < campaigns.length - 1 ? '1px solid var(--border)' : 'none',
                  textDecoration: 'none',
                  color: 'var(--foreground)',
                  flexWrap: 'wrap',
                }}
                className="hover:bg-[var(--border)] transition-colors"
              >
                <div style={{ flex: 1, minWidth: 180 }}>
                  <p style={{ margin: 0, fontWeight: 500, fontSize: '0.9rem' }}>{c.subject}</p>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', opacity: 0.5 }}>
                    {c.status === 'sent'
                      ? `Sent ${new Date(c.sent_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${c.recipient_count} recipients`
                      : `Created ${new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    }
                  </p>
                </div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.65rem',
                  borderRadius: '100px',
                  background: c.status === 'sent' ? '#dbeafe' : '#fef9c3',
                  color: c.status === 'sent' ? '#1e40af' : '#854d0e',
                  whiteSpace: 'nowrap',
                }}>
                  {c.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.375rem' }
const labelText: React.CSSProperties = { fontSize: '0.8rem', fontWeight: 500, opacity: 0.6 }
const inputStyle: React.CSSProperties = {
  padding: '0.6rem 0.875rem',
  borderRadius: '0.5rem',
  border: '1px solid var(--border)',
  background: 'var(--background)',
  fontSize: '0.875rem',
  color: 'var(--foreground)',
  fontFamily: 'inherit',
}
const btnPrimary: React.CSSProperties = {
  background: 'var(--foreground)',
  color: 'var(--background)',
  border: 'none',
  padding: '0.55rem 1.25rem',
  borderRadius: '0.5rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}
const btnSecondary: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--border)',
  padding: '0.55rem 1rem',
  borderRadius: '0.5rem',
  fontSize: '0.875rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
  color: 'var(--foreground)',
}
const thStyle: React.CSSProperties = {
  padding: '0.625rem 0.875rem',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: '0.75rem',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  opacity: 0.5,
  whiteSpace: 'nowrap',
}
