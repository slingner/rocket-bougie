'use client'

import Link from 'next/link'

export default function Pagination({
  page,
  totalPages,
  filterParams,
}: {
  page: number
  totalPages: number
  filterParams: Record<string, string>
}) {
  if (totalPages <= 1) return null

  function urlForPage(p: number) {
    const params = new URLSearchParams(filterParams)
    if (p > 1) params.set('page', String(p))
    else params.delete('page')
    const str = params.toString()
    return `/admin/products${str ? `?${str}` : ''}`
  }

  // Show a window of pages around current
  const pages: (number | '…')[] = []
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
      pages.push(p)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginTop: '1.5rem' }}>
      <Link
        href={urlForPage(page - 1)}
        aria-disabled={page === 1}
        style={btnStyle(false, page === 1)}
        onClick={e => page === 1 && e.preventDefault()}
      >
        ←
      </Link>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} style={{ padding: '0.3rem 0.4rem', fontSize: '0.8rem', opacity: 0.4 }}>…</span>
        ) : (
          <Link key={p} href={urlForPage(p)} style={btnStyle(p === page, false)}>
            {p}
          </Link>
        )
      )}

      <Link
        href={urlForPage(page + 1)}
        aria-disabled={page === totalPages}
        style={btnStyle(false, page === totalPages)}
        onClick={e => page === totalPages && e.preventDefault()}
      >
        →
      </Link>
    </div>
  )
}

function btnStyle(active: boolean, disabled: boolean): React.CSSProperties {
  return {
    padding: '0.3rem 0.6rem',
    borderRadius: '0.375rem',
    border: '1px solid var(--border)',
    background: active ? 'var(--foreground)' : 'transparent',
    color: active ? 'var(--background)' : 'var(--foreground)',
    fontSize: '0.8rem',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.3 : 1,
    fontFamily: 'inherit',
    minWidth: 32,
    textAlign: 'center',
    textDecoration: 'none',
    display: 'inline-block',
    lineHeight: '1.4',
  }
}
