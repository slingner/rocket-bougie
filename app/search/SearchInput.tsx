'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function SearchInput({ defaultValue }: { defaultValue: string }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = inputRef.current?.value.trim() ?? ''
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <form onSubmit={handleSubmit} style={{ position: 'relative', maxWidth: 560, width: '100%' }}>
      {/* Magnifier icon */}
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        style={{
          position: 'absolute',
          left: '1rem',
          top: '50%',
          transform: 'translateY(-50%)',
          width: 18,
          height: 18,
          opacity: 0.35,
          pointerEvents: 'none',
        }}
      >
        <circle cx="8.5" cy="8.5" r="5.5" />
        <line x1="13" y1="13" x2="17.5" y2="17.5" />
      </svg>

      <input
        ref={inputRef}
        type="search"
        name="q"
        defaultValue={defaultValue}
        autoFocus
        placeholder="Search products…"
        style={{
          width: '100%',
          padding: '0.875rem 3rem 0.875rem 2.75rem',
          borderRadius: '100px',
          border: '1.5px solid var(--border)',
          background: 'var(--background)',
          fontSize: '1rem',
          color: 'var(--foreground)',
          fontFamily: 'var(--font-sans)',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--foreground)' }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
      />

      <button
        type="submit"
        style={{
          position: 'absolute',
          right: '0.375rem',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'var(--foreground)',
          color: 'var(--background)',
          border: 'none',
          borderRadius: '100px',
          padding: '0.5rem 1.25rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
        }}
      >
        Search
      </button>
    </form>
  )
}
