'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { syncProductToFaire, refreshFaireSyncStatus, createFaireDraft } from '../actions'

export default function FaireSyncButton({
  productId,
  linked,
  imageCount = 0,
}: {
  productId: string
  linked: boolean
  imageCount?: number
}) {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'creating' | 'syncing' | 'refreshing' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const busy = status === 'creating' || status === 'syncing' || status === 'refreshing'
  const noImages = imageCount === 0

  if (!linked) {
    async function handleCreate() {
      setStatus('creating')
      setMessage('')
      const result = await createFaireDraft(productId)
      if (result.ok) {
        setStatus('success')
        setMessage('Draft created — finish setup on Faire')
        router.refresh()
        setTimeout(() => setStatus('idle'), 5000)
      } else {
        setStatus('error')
        setMessage(result.error)
      }
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          onClick={handleCreate}
          disabled={busy || noImages}
          title={noImages ? 'Add at least one image before creating a Faire draft' : undefined}
          style={{
            fontSize: '0.8rem',
            padding: '0.35rem 0.875rem',
            border: '1px dashed var(--border)',
            borderRadius: 4,
            background: 'transparent',
            cursor: (busy || noImages) ? 'not-allowed' : 'pointer',
            opacity: (busy || noImages) ? 0.4 : 1,
            fontFamily: 'inherit',
            color: 'var(--foreground)',
          }}
        >
          {status === 'creating' ? 'Creating…' : '+ Create Faire draft'}
        </button>
        {noImages && (
          <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>Add images first</span>
        )}
        {(status === 'success' || status === 'error') && (
          <span style={{ fontSize: '0.75rem', color: status === 'error' ? '#dc2626' : '#166534' }}>
            {message}
          </span>
        )}
      </div>
    )
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
        <span style={{ fontSize: '0.8rem', color: status === 'error' ? '#dc2626' : '#166534' }}>
          {message}
        </span>
      )}
    </div>
  )
}
