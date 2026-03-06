'use client'

import { useState } from 'react'
import { syncProductToFaire } from '../actions'

export default function FaireSyncButton({
  productId,
  linked,
}: {
  productId: string
  linked: boolean
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  if (!linked) {
    return (
      <span style={{ fontSize: '0.8rem', opacity: 0.4 }}>Not linked to Faire</span>
    )
  }

  async function handleSync() {
    setStatus('loading')
    setErrorMsg('')
    const result = await syncProductToFaire(productId)
    if (result.ok) {
      setStatus('success')
      setTimeout(() => setStatus('idle'), 3000)
    } else {
      setStatus('error')
      setErrorMsg(result.error)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <button
        onClick={handleSync}
        disabled={status === 'loading'}
        style={{
          fontSize: '0.8rem',
          padding: '0.35rem 0.75rem',
          border: '1px solid var(--border)',
          borderRadius: 4,
          background: 'transparent',
          cursor: status === 'loading' ? 'not-allowed' : 'pointer',
          opacity: status === 'loading' ? 0.5 : 1,
        }}
      >
        {status === 'loading' ? 'Syncing...' : 'Sync to Faire'}
      </button>
      {status === 'success' && (
        <span style={{ fontSize: '0.8rem', color: 'green' }}>Synced</span>
      )}
      {status === 'error' && (
        <span style={{ fontSize: '0.8rem', color: 'red' }}>{errorMsg}</span>
      )}
    </div>
  )
}
