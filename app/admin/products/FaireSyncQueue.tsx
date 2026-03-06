'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { bulkSyncToFaire } from '../actions'

type QueuedProduct = {
  id: string
  title: string
  unsyncedCount: number
}

export default function FaireSyncQueue({ products }: { products: QueuedProduct[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  if (products.length === 0) return null

  const totalImages = products.reduce((sum, p) => sum + p.unsyncedCount, 0)
  const busy = status === 'syncing'

  async function handleSync() {
    setStatus('syncing')
    setMessage('')
    const result = await bulkSyncToFaire()
    if (result.ok) {
      setStatus('done')
      setMessage(`${result.synced} product${result.synced === 1 ? '' : 's'} synced`)
      router.refresh()
      setTimeout(() => { setStatus('idle'); setOpen(false) }, 3000)
    } else {
      setStatus('error')
      setMessage(result.error)
    }
  }

  return (
    <>
      <style>{`
        @keyframes faire-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
        }
      `}</style>

      <div style={{ position: 'relative' }}>
        {/* Collapsed pill */}
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.45rem 0.875rem',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            background: open ? 'var(--muted)' : 'transparent',
            fontSize: '0.8rem',
            fontFamily: 'inherit',
            color: 'var(--foreground)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'background 0.15s',
          }}
        >
          <span style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: '#EAA221',
            display: 'inline-block',
            flexShrink: 0,
            animation: 'faire-pulse 2.5s ease-in-out infinite',
          }} />
          {products.length} queued
          <span style={{ opacity: 0.35, fontSize: '0.65rem' }}>{open ? '▲' : '▼'}</span>
        </button>

        {/* Dropdown card */}
        {open && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            width: 310,
            background: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.09)',
            zIndex: 50,
            overflow: 'hidden',
          }}>

            {/* Header */}
            <div style={{
              padding: '0.875rem 1rem 0.7rem',
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                opacity: 0.4,
                marginBottom: '0.2rem',
              }}>
                Faire sync queue
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: 500 }}>
                {totalImages} image{totalImages !== 1 ? 's' : ''} across {products.length} product{products.length !== 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: '0.15rem' }}>
                auto-syncs nightly at 2am EST
              </div>
            </div>

            {/* Product list */}
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {products.map((p, i) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 1rem',
                    borderBottom: i < products.length - 1 ? '1px solid var(--border)' : 'none',
                    fontSize: '0.8rem',
                    gap: '0.75rem',
                  }}
                >
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flexShrink: 1,
                  }}>
                    {p.title}
                  </span>
                  <span style={{
                    flexShrink: 0,
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    padding: '0.15rem 0.5rem',
                    borderRadius: 100,
                    background: '#fef3c7',
                    color: '#92400e',
                    whiteSpace: 'nowrap',
                  }}>
                    {p.unsyncedCount} img{p.unsyncedCount !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{
              padding: '0.75rem 1rem',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}>
              <span style={{
                fontSize: '0.75rem',
                color: status === 'error' ? '#dc2626' : '#166534',
                opacity: status === 'idle' ? 0 : 1,
              }}>
                {message}
              </span>
              <button
                onClick={handleSync}
                disabled={busy}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: 'var(--foreground)',
                  color: 'var(--background)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: busy ? 'not-allowed' : 'pointer',
                  opacity: busy ? 0.5 : 1,
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {busy ? 'Syncing…' : 'Sync now →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
