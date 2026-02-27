'use client'

import { useRouter, usePathname } from 'next/navigation'

export default function ProductFilters({
  allTypes,
  allTags,
  currentType,
  currentTag,
  currentPublished,
  currentSort,
}: {
  allTypes: string[]
  allTags: string[]
  currentType?: string
  currentTag?: string
  currentPublished?: string
  currentSort?: string
}) {
  const router = useRouter()
  const pathname = usePathname()

  function update(key: string, value: string | undefined) {
    const params = new URLSearchParams()
    const current: Record<string, string | undefined> = {
      type: currentType,
      tag: currentTag,
      published: currentPublished,
      sort: currentSort,
      [key]: value,
    }
    for (const [k, v] of Object.entries(current)) {
      if (v) params.set(k, v)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const hasFilters = currentType || currentTag || currentPublished || currentSort

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1rem',
      }}
    >
      {/* Type */}
      <select
        value={currentType ?? ''}
        onChange={e => update('type', e.target.value || undefined)}
        style={selectStyle}
      >
        <option value="">All types</option>
        {allTypes.map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      {/* Tag */}
      <select
        value={currentTag ?? ''}
        onChange={e => update('tag', e.target.value || undefined)}
        style={selectStyle}
      >
        <option value="">All tags</option>
        {allTags.map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      {/* Published */}
      <select
        value={currentPublished ?? ''}
        onChange={e => update('published', e.target.value || undefined)}
        style={selectStyle}
      >
        <option value="">Published + drafts</option>
        <option value="yes">Published only</option>
        <option value="no">Drafts only</option>
      </select>

      {/* Sort */}
      <select
        value={currentSort ?? ''}
        onChange={e => update('sort', e.target.value || undefined)}
        style={selectStyle}
      >
        <option value="">Sort: A–Z</option>
        <option value="price-asc">Sort: Price low → high</option>
        <option value="price-desc">Sort: Price high → low</option>
      </select>

      {/* Clear */}
      {hasFilters && (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            padding: '0.4rem 0.875rem',
            fontSize: '0.8rem',
            cursor: 'pointer',
            fontFamily: 'inherit',
            color: 'var(--foreground)',
            opacity: 0.6,
          }}
          className="hover:opacity-100"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  padding: '0.4rem 0.75rem',
  borderRadius: '0.5rem',
  border: '1px solid var(--border)',
  background: 'var(--background)',
  fontSize: '0.8rem',
  color: 'var(--foreground)',
  fontFamily: 'inherit',
  cursor: 'pointer',
}
