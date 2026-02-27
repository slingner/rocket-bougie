'use client'

import { useState, useRef, useEffect } from 'react'

export default function TagInput({
  value,
  onChange,
  allTags,
}: {
  value: string[]
  onChange: (tags: string[]) => void
  allTags: string[]
}) {
  const [inputValue, setInputValue] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const suggestions = allTags.filter(
    t => t.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(t)
  )

  function addTag(tag: string) {
    const trimmed = tag.trim()
    if (!trimmed || value.includes(trimmed)) return
    onChange([...value, trimmed])
    setInputValue('')
    inputRef.current?.focus()
  }

  function removeTag(tag: string) {
    onChange(value.filter(t => t !== tag))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (inputValue.trim()) addTag(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  // Close dropdown when clicking outside
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
      {/* Tag chips + input */}
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.375rem',
          padding: '0.5rem 0.75rem',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)',
          background: 'var(--background)',
          cursor: 'text',
          minHeight: 42,
          alignItems: 'center',
        }}
      >
        {value.map(tag => (
          <span
            key={tag}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              background: 'var(--accent)',
              color: 'var(--foreground)',
              borderRadius: '100px',
              padding: '0.15rem 0.6rem',
              fontSize: '0.78rem',
              fontWeight: 500,
              lineHeight: 1.5,
            }}
          >
            {tag}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); removeTag(tag) }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                lineHeight: 1,
                color: 'inherit',
                opacity: 0.6,
                fontSize: '0.85rem',
              }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => { setInputValue(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? 'Add tags…' : ''}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '0.875rem',
            color: 'var(--foreground)',
            fontFamily: 'inherit',
            minWidth: 80,
            flex: 1,
            padding: 0,
          }}
        />
      </div>

      {/* Dropdown */}
      {open && (inputValue || suggestions.length > 0) && (
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
            maxHeight: 220,
            overflowY: 'auto',
          }}
        >
          {/* Create new option */}
          {inputValue.trim() && !allTags.includes(inputValue.trim()) && (
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); addTag(inputValue) }}
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
                borderBottom: suggestions.length > 0 ? '1px solid var(--border)' : 'none',
              }}
              className="hover:bg-[var(--muted)]"
            >
              <span style={{ opacity: 0.5 }}>Create </span>
              <strong>{inputValue.trim()}</strong>
            </button>
          )}

          {/* Existing tag matches */}
          {suggestions.map(tag => (
            <button
              key={tag}
              type="button"
              onMouseDown={e => { e.preventDefault(); addTag(tag) }}
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
              {tag}
            </button>
          ))}

          {suggestions.length === 0 && !inputValue.trim() && (
            <p style={{ padding: '0.5rem 0.875rem', fontSize: '0.8rem', opacity: 0.4, margin: 0 }}>
              No more tags to add
            </p>
          )}
        </div>
      )}
    </div>
  )
}
