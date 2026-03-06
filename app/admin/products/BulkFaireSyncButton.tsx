'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { bulkSyncToFaire } from '../actions'

export default function BulkFaireSyncButton({ count }: { count: number }) {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  if (count === 0) return null

  async function handleSync() {
    setStatus('syncing')
    setMessage('')
    const result = await bulkSyncToFaire()
    if (result.ok) {
      setStatus('done')
      setMessage(`${result.synced} product${result.synced === 1 ? '' : 's'} synced`)
      router.refresh()
      setTimeout(() => setStatus('idle'), 4000)
    } else {
      setStatus('error')
      setMessage(result.error)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <button
        onClick={handleSync}
        disabled={status === 'syncing'}
        style={{
          fontSize: '0.8rem',
          padding: '0.5rem 1rem',
          border: '1px solid var(--border)',
          borderRadius: '0.5rem',
          background: 'transparent',
          cursor: status === 'syncing' ? 'not-allowed' : 'pointer',
          opacity: status === 'syncing' ? 0.5 : 1,
          whiteSpace: 'nowrap',
        }}
      >
        {status === 'syncing' ? 'Syncing...' : `Sync ${count} to Faire`}
      </button>
      {(status === 'done' || status === 'error') && (
        <span style={{ fontSize: '0.8rem', color: status === 'error' ? 'red' : 'green' }}>
          {message}
        </span>
      )}
    </div>
  )
}
