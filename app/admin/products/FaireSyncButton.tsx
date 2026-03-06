'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { syncProductToFaire, refreshFaireSyncStatus } from '../actions'

export default function FaireSyncButton({
  productId,
  linked,
}: {
  productId: string
  linked: boolean
}) {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'syncing' | 'refreshing' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  if (!linked) {
    return <span style={{ fontSize: '0.8rem', opacity: 0.4 }}>Not linked to Faire</span>
  }

  async function handleSync() {
    setStatus('syncing')
    setMessage('')
    const result = await syncProductToFaire(productId)
    if (result.ok) {
      setStatus('success')
      setMessage('Synced')
      router.refresh()
      setTimeout(() => setStatus('idle'), 3000)
    } else {
      setStatus('error')
      setMessage(result.error)
    }
  }

  async function handleRefresh() {
    setStatus('refreshing')
    setMessage('')
    const result = await refreshFaireSyncStatus(productId)
    if (result.ok) {
      setStatus('success')
      setMessage(result.reset > 0 ? `${result.reset} image${result.reset === 1 ? '' : 's'} marked unsynced` : 'Up to date')
      router.refresh()
      setTimeout(() => setStatus('idle'), 3000)
    } else {
      setStatus('error')
      setMessage(result.error)
    }
  }

  const busy = status === 'syncing' || status === 'refreshing'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <button
        onClick={handleSync}
        disabled={busy}
        style={{
          fontSize: '0.8rem',
          padding: '0.35rem 0.75rem',
          border: '1px solid var(--border)',
          borderRadius: 4,
          background: 'transparent',
          cursor: busy ? 'not-allowed' : 'pointer',
          opacity: busy ? 0.5 : 1,
        }}
      >
        {status === 'syncing' ? 'Syncing...' : 'Sync to Faire'}
      </button>
      <button
        onClick={handleRefresh}
        disabled={busy}
        title="Check which images are still on Faire"
        style={{
          fontSize: '0.8rem',
          padding: '0.35rem 0.5rem',
          border: '1px solid var(--border)',
          borderRadius: 4,
          background: 'transparent',
          cursor: busy ? 'not-allowed' : 'pointer',
          opacity: busy ? 0.5 : 0.6,
        }}
        className="hover:opacity-100"
      >
        ↻
      </button>
      {(status === 'success' || status === 'error') && (
        <span style={{ fontSize: '0.8rem', color: status === 'error' ? 'red' : 'green' }}>
          {message}
        </span>
      )}
    </div>
  )
}
