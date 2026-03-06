'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { searchProductTitles } from '../actions'

export default function ProductSearch({
  currentSearch,
  filterParams,
}: {
  currentSearch?: string
  filterParams: Record<string, string>
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [value, setValue] = useState(currentSearch ?? '')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => { setValue(currentSearch ?? '') }, [currentSearch])

  function navigate(search: string) {
    const params = new URLSearchParams(filterParams)
    if (search.trim()) params.set('search', search.trim())
    else params.delete('search')
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  function onChange(q: string) {
    setValue(q)
    clearTimeout(debounceRef.current)
    if (!q.trim()) { setSuggestions([]); setOpen(false); return }
    debounceRef.current = setTimeout(async () => {
      const results = await searchProductTitles(q)
      setSuggestions(results)
      setOpen(results.length > 0)
    }, 250)
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setOpen(false)
    navigate(value)
  }

  return (
    <div style={{ position: 'relative', width: 260 }}>
      <form onSubmit={onSubmit}>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search products…"
          style={{
            width: '100%',
            padding: '0.4rem 2rem 0.4rem 0.75rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--border)',
            background: 'var(--background)',
            fontSize: '0.8rem',
            fontFamily: 'inherit',
            color: 'var(--foreground)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {value && (
          <button
            type="button"
            onClick={() => { setValue(''); setSuggestions([]); setOpen(false); navigate('') }}
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              opacity: 0.4,
              fontSize: '1rem',
              padding: 0,
              lineHeight: 1,
              color: 'var(--foreground)',
            }}
          >
            ×
          </button>
        )}
      </form>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: 'var(--background)',
          border: '1px solid var(--border)',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          zIndex: 50,
          overflow: 'hidden',
        }}>
          {suggestions.map(title => (
            <button
              key={title}
              onMouseDown={() => { setOpen(false); setValue(title); navigate(title) }}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.5rem 0.75rem',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontFamily: 'inherit',
                color: 'var(--foreground)',
              }}
              className="hover:bg-[var(--muted)] last:border-b-0"
            >
              {title}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
