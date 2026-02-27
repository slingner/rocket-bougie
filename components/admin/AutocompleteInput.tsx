'use client'

import { useState, useRef, useEffect } from 'react'

export default function AutocompleteInput({
  value,
  onChange,
  suggestions,
  placeholder = 'Set type…',
}: {
  value: string
  onChange: (value: string) => void
  suggestions: string[]
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const matches = suggestions.filter(s =>
    s.toLowerCase().includes(search.toLowerCase())
  )

  // If typed something not in the list, offer to use it as-is
  const isNew = search.trim() && !suggestions.some(s => s.toLowerCase() === search.trim().toLowerCase())

  function openDropdown() {
    setSearch('')
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function select(val: string) {
    onChange(val)
    setOpen(false)
    setSearch('')
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
    setOpen(false)
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Pill when a value is selected, input trigger when empty */}
      {value && !open ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <button
            type="button"
            onClick={openDropdown}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'var(--foreground)',
              color: 'var(--background)',
              borderRadius: '100px',
              padding: '0.2rem 0.75rem 0.2rem 0.875rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              letterSpacing: '0.01em',
            }}
          >
            {value}
            <span
              onClick={clear}
              style={{
                fontSize: '0.9rem',
                opacity: 0.5,
                lineHeight: 1,
                cursor: 'pointer',
              }}
              role="button"
              aria-label="Clear type"
            >
              ×
            </span>
          </button>
          <span style={{ fontSize: '0.75rem', opacity: 0.35, cursor: 'pointer' }} onClick={openDropdown}>
            change
          </span>
        </div>
      ) : (
        <input
          ref={inputRef}
          type="text"
          value={open ? search : ''}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => { setSearch(''); setOpen(true) }}
          onKeyDown={e => {
            if (e.key === 'Escape') { setOpen(false); setSearch('') }
            if (e.key === 'Enter' && search.trim()) {
              e.preventDefault()
              select(matches[0] ?? search.trim())
            }
          }}
          placeholder={value || placeholder}
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
      )}

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            minWidth: 200,
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
              onMouseDown={e => { e.preventDefault(); select(s) }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '0.5rem 0.875rem',
                background: s === value ? 'var(--muted)' : 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                color: 'var(--foreground)',
                fontWeight: s === value ? 600 : 400,
              }}
              className="hover:bg-[var(--muted)]"
            >
              {s}
            </button>
          ))}

          {isNew && (
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); select(search.trim()) }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '0.5rem 0.875rem',
                background: 'none',
                border: 'none',
                borderTop: matches.length > 0 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                color: 'var(--foreground)',
              }}
              className="hover:bg-[var(--muted)]"
            >
              <span style={{ opacity: 0.45 }}>Use </span>
              <strong>{search.trim()}</strong>
            </button>
          )}

          {matches.length === 0 && !isNew && (
            <p style={{ padding: '0.5rem 0.875rem', fontSize: '0.8rem', opacity: 0.4, margin: 0 }}>
              No types yet
            </p>
          )}
        </div>
      )}
    </div>
  )
}
