'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { useCart } from '@/lib/cart'
import { createClient } from '@/lib/supabase/client'

const collections = [
  { label: 'California', slug: 'california' },
  { label: 'Food & Friends', slug: 'food' },
  { label: 'Ocean', slug: 'ocean' },
  { label: 'Pets', slug: 'pets' },
  { label: 'Space', slug: 'space' },
]

const productTypes = [
  { label: 'Stickers', slug: 'stickers' },
  { label: 'Sticker Packs', slug: 'sticker-packs' },
  { label: 'Prints', slug: 'prints' },
  { label: 'Mini Prints & Postcards', slug: 'mini-prints' },
  { label: 'Greeting Cards', slug: 'cards' },
]

type DropdownKey = 'collections' | 'shop' | null

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<DropdownKey>(null)
  const { itemCount } = useCart()
  const [loggedIn, setLoggedIn] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session)
    })
    return () => subscription.unsubscribe()
  }, [])

  function openDropdown(key: DropdownKey) {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setActiveDropdown(key)
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setActiveDropdown(null), 120)
  }

  return (
    <header
      style={{ borderBottom: '1px solid var(--border)', background: 'var(--background)' }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="shrink-0" style={{ lineHeight: 0 }}>
            <Image
              src="/logo.png"
              alt="Rocket Boogie Co."
              width={560}
              height={312}
              style={{ height: 52, width: 'auto' }}
              priority
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">

            <Link
              href="/shop"
              style={{ fontSize: '0.875rem', fontWeight: 500 }}
              className="text-foreground opacity-70 hover:opacity-100 transition-opacity no-underline"
            >
              Shop All
            </Link>

            {/* Collections dropdown */}
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => openDropdown('collections')}
              onMouseLeave={scheduleClose}
            >
              <button
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  opacity: activeDropdown === 'collections' ? 1 : 0.7,
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--foreground)',
                  padding: 0,
                  transition: 'opacity 0.15s',
                }}
              >
                Collections ▾
              </button>
              {activeDropdown === 'collections' && (
                <div
                  onMouseEnter={() => openDropdown('collections')}
                  onMouseLeave={scheduleClose}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginTop: '0.75rem',
                    background: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.75rem',
                    padding: '0.5rem',
                    minWidth: 180,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    zIndex: 100,
                  }}
                >
                  {collections.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/shop?collection=${c.slug}`}
                      onClick={() => setActiveDropdown(null)}
                      style={{
                        display: 'block',
                        padding: '0.5rem 0.875rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        textDecoration: 'none',
                        color: 'var(--foreground)',
                        transition: 'background 0.1s',
                      }}
                      className="hover:bg-[var(--muted)]"
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Shop by type dropdown */}
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => openDropdown('shop')}
              onMouseLeave={scheduleClose}
            >
              <button
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  opacity: activeDropdown === 'shop' ? 1 : 0.7,
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--foreground)',
                  padding: 0,
                  transition: 'opacity 0.15s',
                }}
              >
                Products ▾
              </button>
              {activeDropdown === 'shop' && (
                <div
                  onMouseEnter={() => openDropdown('shop')}
                  onMouseLeave={scheduleClose}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginTop: '0.75rem',
                    background: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.75rem',
                    padding: '0.5rem',
                    minWidth: 180,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    zIndex: 100,
                  }}
                >
                  {productTypes.map((t) => (
                    <Link
                      key={t.slug}
                      href={`/shop?type=${t.slug}`}
                      onClick={() => setActiveDropdown(null)}
                      style={{
                        display: 'block',
                        padding: '0.5rem 0.875rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        textDecoration: 'none',
                        color: 'var(--foreground)',
                        transition: 'background 0.1s',
                      }}
                      className="hover:bg-[var(--muted)]"
                    >
                      {t.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/about"
              style={{ fontSize: '0.875rem', fontWeight: 500 }}
              className="text-foreground opacity-70 hover:opacity-100 transition-opacity no-underline"
            >
              About
            </Link>

            <Link
              href="/events"
              style={{ fontSize: '0.875rem', fontWeight: 500 }}
              className="text-foreground opacity-70 hover:opacity-100 transition-opacity no-underline"
            >
              Events
            </Link>

            <Link
              href="/wholesale"
              style={{ fontSize: '0.875rem', fontWeight: 500 }}
              className="text-foreground opacity-70 hover:opacity-100 transition-opacity no-underline"
            >
              Wholesale
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
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
                fontWeight: 600,
                background: 'var(--accent)',
                padding: '0.5rem 1.25rem',
                borderRadius: '100px',
                color: 'var(--foreground)',
              }}
              className="no-underline hidden md:block hover:opacity-80 transition-opacity"
            >
              Cart ({itemCount})
            </Link>

            {/* Mobile hamburger */}
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
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          style={{ borderTop: '1px solid var(--border)', background: 'var(--background)' }}
          className="md:hidden px-6 py-4 flex flex-col gap-1"
        >
          <MobileLink href="/shop" onClick={() => setMenuOpen(false)}>Shop All</MobileLink>

          <MobileExpandable
            label="Collections"
            expanded={mobileExpanded === 'collections'}
            onToggle={() => setMobileExpanded(mobileExpanded === 'collections' ? null : 'collections')}
          >
            {collections.map((c) => (
              <MobileSubLink key={c.slug} href={`/shop?collection=${c.slug}`} onClick={() => setMenuOpen(false)}>
                {c.label}
              </MobileSubLink>
            ))}
          </MobileExpandable>

          <MobileExpandable
            label="Products"
            expanded={mobileExpanded === 'shop'}
            onToggle={() => setMobileExpanded(mobileExpanded === 'shop' ? null : 'shop')}
          >
            {productTypes.map((t) => (
              <MobileSubLink key={t.slug} href={`/shop?type=${t.slug}`} onClick={() => setMenuOpen(false)}>
                {t.label}
              </MobileSubLink>
            ))}
          </MobileExpandable>

          <MobileLink href="/about" onClick={() => setMenuOpen(false)}>About</MobileLink>
          <MobileLink href="/events" onClick={() => setMenuOpen(false)}>Events</MobileLink>
          <MobileLink href="/wholesale" onClick={() => setMenuOpen(false)}>Wholesale</MobileLink>

          <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.75rem', display: 'flex', gap: '0.75rem' }}>
            <Link
              href={loggedIn ? '/account' : '/account/login'}
              style={{ fontSize: '0.875rem', fontWeight: 500, opacity: 0.6 }}
              className="text-foreground no-underline"
              onClick={() => setMenuOpen(false)}
            >
              {loggedIn ? 'Account' : 'Sign in'}
            </Link>
            <Link
              href="/cart"
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                background: 'var(--accent)',
                padding: '0.4rem 1rem',
                borderRadius: '100px',
                color: 'var(--foreground)',
              }}
              className="no-underline"
              onClick={() => setMenuOpen(false)}
            >
              Cart ({itemCount})
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

function MobileLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{ fontSize: '1rem', fontWeight: 500, padding: '0.5rem 0', display: 'block' }}
      className="text-foreground no-underline opacity-80 hover:opacity-100"
    >
      {children}
    </Link>
  )
}

function MobileSubLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{ fontSize: '0.9rem', padding: '0.35rem 0 0.35rem 0.75rem', display: 'block', borderLeft: '2px solid var(--border)' }}
      className="text-foreground no-underline opacity-65 hover:opacity-100"
    >
      {children}
    </Link>
  )
}

function MobileExpandable({ label, expanded, onToggle, children }: {
  label: string
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        style={{
          fontSize: '1rem',
          fontWeight: 500,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.5rem 0',
          width: '100%',
          textAlign: 'left',
          color: 'var(--foreground)',
          fontFamily: 'var(--font-sans)',
          opacity: 0.8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {label}
        <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{expanded ? '▲' : '▾'}</span>
      </button>
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.25rem' }}>
          {children}
        </div>
      )}
    </div>
  )
}
