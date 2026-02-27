'use client'

import { useState, useRef, useEffect } from 'react'

export default function AutocompleteInput({
  value,
  onChange,
  suggestions,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  suggestions: string[]
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const matches = suggestions.filter(
    s => s.toLowerCase().includes(value.toLowerCase()) && s !== value
  )

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={e => { if (e.key === 'Escape') setOpen(false) }}
        placeholder={placeholder}
        style={{
          padding: '0.6rem 0.875rem',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)',
          background: 'var(--background)',
          fontSize: '0.875rem',
          color: 'var(--foreground)',
          fontFamily: 'inherit',
          width: '100%',
        }}
      />

      {open && matches.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            zIndex: 100,
            overflow: 'hidden',
          }}
        >
          {matches.map(s => (
            <button
              key={s}
              type="button"
              onMouseDown={e => { e.preventDefault(); onChange(s); setOpen(false) }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '0.5rem 0.875rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                color: 'var(--foreground)',
              }}
              className="hover:bg-[var(--muted)]"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
