'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteProducts } from '../actions'

export default function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        style={{
          fontSize: '0.8rem',
          padding: '0.35rem 0.875rem',
          border: '1px solid #fca5a5',
          borderRadius: 4,
          background: 'transparent',
          cursor: 'pointer',
          color: '#dc2626',
          fontFamily: 'inherit',
        }}
      >
        Delete product
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Are you sure?</span>
      <button
        onClick={() => {
          startTransition(async () => {
            await deleteProducts([productId])
            router.push('/admin/products')
          })
        }}
        disabled={isPending}
        style={{
          fontSize: '0.8rem',
          padding: '0.35rem 0.875rem',
          border: 'none',
          borderRadius: 4,
          background: '#dc2626',
          color: '#fff',
          cursor: isPending ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          opacity: isPending ? 0.6 : 1,
        }}
      >
        {isPending ? 'Deleting…' : 'Yes, delete'}
      </button>
      <button
        onClick={() => setConfirming(false)}
        style={{
          fontSize: '0.8rem',
          padding: '0.35rem 0.875rem',
          border: '1px solid var(--border)',
          borderRadius: 4,
          background: 'transparent',
          cursor: 'pointer',
          fontFamily: 'inherit',
          color: 'var(--foreground)',
        }}
      >
        Cancel
      </button>
    </div>
  )
}
