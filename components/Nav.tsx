'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useCart } from '@/lib/cart'
import { createClient } from '@/lib/supabase/client'

const collections = [
  { label: 'All', slug: null },
  { label: 'California', slug: 'california' },
  { label: 'Food & Friends', slug: 'food' },
  { label: 'Ocean', slug: 'ocean' },
  { label: 'Pets', slug: 'pets' },
  { label: 'Space', slug: 'space' },
]

const categories = [
  { label: 'Stickers', slug: 'stickers' },
  { label: 'Prints', slug: 'prints' },
  { label: 'Cards', slug: 'cards' },
  { label: 'Sticker Packs', slug: 'sticker-packs' },
]

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { itemCount } = useCart()
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--background)' }} className="sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', letterSpacing: '-0.02em' }}
            className="text-foreground no-underline"
          >
            Rocket Boogie Co.
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/shop?type=${c.slug}`}
                style={{ fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.01em' }}
                className="text-foreground opacity-70 hover:opacity-100 transition-opacity no-underline"
              >
                {c.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link
              href={loggedIn ? '/account' : '/account/login'}
              style={{ fontSize: '0.875rem', fontWeight: 500 }}
              className="text-foreground opacity-70 hover:opacity-100 transition-opacity no-underline hidden md:block"
            >
              {loggedIn ? 'Account' : 'Sign in'}
            </Link>
            <Link
              href="/cart"
              style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                background: 'var(--accent)',
                padding: '0.5rem 1.25rem',
                borderRadius: '100px',
                color: 'var(--foreground)',
              }}
              className="no-underline hidden md:block"
            >
              Cart ({itemCount})
            </Link>

            {/* Mobile menu button */}
            <button
              className="md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <div style={{ width: 22, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ height: 2, background: 'var(--foreground)', display: 'block', borderRadius: 2 }} />
                <span style={{ height: 2, background: 'var(--foreground)', display: 'block', borderRadius: 2 }} />
                <span style={{ height: 2, background: 'var(--foreground)', display: 'block', borderRadius: 2, width: menuOpen ? '100%' : '70%' }} />
              </div>
            </button>
          </div>
        </div>

        {/* Collection filter bar */}
        <div
          className="hidden md:flex items-center gap-2 pb-3 overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          {collections.map((c) => (
            <Link
              key={c.label}
              href={c.slug ? `/shop?collection=${c.slug}` : '/shop'}
              style={{
                fontSize: '0.8rem',
                fontWeight: 500,
                padding: '0.3rem 0.9rem',
                borderRadius: '100px',
                border: '1px solid var(--border)',
                whiteSpace: 'nowrap',
                color: 'var(--foreground)',
              }}
              className="no-underline hover:bg-[var(--muted)] transition-colors"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          style={{ borderTop: '1px solid var(--border)', background: 'var(--background)' }}
          className="md:hidden px-6 py-4 flex flex-col gap-3"
        >
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/shop?type=${c.slug}`}
              style={{ fontSize: '1rem', fontWeight: 500 }}
              className="text-foreground no-underline"
              onClick={() => setMenuOpen(false)}
            >
              {c.label}
            </Link>
          ))}
          <hr style={{ borderColor: 'var(--border)' }} />
          {collections.map((c) => (
            <Link
              key={c.label}
              href={c.slug ? `/shop?collection=${c.slug}` : '/shop'}
              style={{ fontSize: '0.9rem', opacity: 0.7 }}
              className="text-foreground no-underline"
              onClick={() => setMenuOpen(false)}
            >
              {c.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
