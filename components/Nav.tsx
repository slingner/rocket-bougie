'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { useCart } from '@/lib/cart'
import { createClient } from '@/lib/supabase/client'

const IMG = 'https://blrwnsdqucoudycjkjfq.supabase.co/storage/v1/object/public/product-images/products'

const collections = [
  { label: 'California', slug: 'california', img: `${IMG}/00e5280a-d7e6-441d-a759-282d93c5206e/1.png` },
  { label: 'Food & Friends', slug: 'food', img: `${IMG}/24c353fe-0f5a-4172-a430-571e70679b4e/1.jpg` },
  { label: 'Ocean', slug: 'ocean', img: `${IMG}/112f33bb-cbaa-4188-a9b3-4cc9f9a293e9/1.png` },
  { label: 'Pets', slug: 'pets', img: `${IMG}/08606668-8f74-4f7c-8570-2f3118e22f80/1.jpg` },
  { label: 'Space', slug: 'space', img: `${IMG}/dbc0cb06-ecc3-48f2-b034-e41265ff5b20/1.png` },
]

const productTypes = [
  { label: 'Stickers', slug: 'stickers', img: `${IMG}/2960df10-eaa5-410c-87ab-baba2bb94726/1.png` },
  { label: 'Sticker Packs', slug: 'sticker-packs', img: `${IMG}/f1f50ecf-9d6c-46e2-91be-d9614a7e8858/1.jpg` },
  { label: 'Prints', slug: 'prints', img: `${IMG}/00e5280a-d7e6-441d-a759-282d93c5206e/1.png` },
  { label: 'Mini Prints', slug: 'mini-prints', img: `${IMG}/017a5229-e402-4ad3-939a-f8d80d4bd165/1.jpg` },
  { label: 'Greeting Cards', slug: 'cards', img: `${IMG}/2f1dc222-3a48-4de2-8fa2-2422834656ba/1.jpg` },
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

            {/* Collections mega menu */}
            <div
              style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
              onMouseEnter={() => openDropdown('collections')}
              onMouseLeave={scheduleClose}
              onFocusCapture={() => openDropdown('collections')}
              onBlurCapture={scheduleClose}
            >
              <button
                aria-haspopup="true"
                aria-expanded={activeDropdown === 'collections'}
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                Collections
                <span style={{
                  display: 'inline-block',
                  width: 6,
                  height: 6,
                  borderRight: '1.5px solid currentColor',
                  borderBottom: '1.5px solid currentColor',
                  transform: activeDropdown === 'collections' ? 'rotate(-135deg)' : 'rotate(45deg)',
                marginBottom: activeDropdown === 'collections' ? '-2px' : '2px',
                  transition: 'transform 0.2s ease',
                  opacity: 0.5,
                }} />
              </button>

              {activeDropdown === 'collections' && (
                <div
                  onMouseEnter={() => openDropdown('collections')}
                  onMouseLeave={scheduleClose}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 1rem)',
                    left: '50%',
                    transform: 'translateX(-30%)',
                    background: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '1rem',
                    padding: '1.25rem',
                    width: 520,
                    boxShadow: '0 16px 48px rgba(0,0,0,0.09), 0 4px 16px rgba(0,0,0,0.05)',
                    zIndex: 100,
                  }}
                >
                  {/* Caret */}
                  <div style={{
                    position: 'absolute',
                    top: -7,
                    left: '30%',
                    marginLeft: -7,
                    width: 13,
                    height: 13,
                    background: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderBottom: 'none',
                    borderRight: 'none',
                    transform: 'rotate(45deg)',
                  }} />

                  <p style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.35, margin: '0 0 1rem' }}>
                    Shop by collection
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.375rem' }}>
                    {collections.map((c) => (
                      <Link
                        key={c.slug}
                        href={`/shop?collection=${c.slug}`}
                        onClick={() => setActiveDropdown(null)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.625rem 0.375rem',
                          borderRadius: '0.625rem',
                          textDecoration: 'none',
                          color: 'var(--foreground)',
                          transition: 'background 0.1s',
                        }}
                        className="hover:bg-[var(--muted)]"
                      >
                        <div style={{
                          width: 76,
                          height: 76,
                          borderRadius: '0.5rem',
                          overflow: 'hidden',
                          background: 'var(--muted)',
                          flexShrink: 0,
                        }}>
                          <Image
                            src={c.img}
                            alt={c.label}
                            width={76}
                            height={76}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 500, textAlign: 'center', lineHeight: 1.3 }}>
                          {c.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', marginTop: '1rem', paddingTop: '0.75rem' }}>
                    <Link
                      href="/shop"
                      onClick={() => setActiveDropdown(null)}
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--foreground)',
                        textDecoration: 'none',
                        opacity: 0.4,
                      }}
                      className="hover:opacity-100 transition-opacity"
                    >
                      Shop all collections →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Products mega menu */}
            <div
              style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
              onMouseEnter={() => openDropdown('shop')}
              onMouseLeave={scheduleClose}
              onFocusCapture={() => openDropdown('shop')}
              onBlurCapture={scheduleClose}
            >
              <button
                aria-haspopup="true"
                aria-expanded={activeDropdown === 'shop'}
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                Products
                <span style={{
                  display: 'inline-block',
                  width: 6,
                  height: 6,
                  borderRight: '1.5px solid currentColor',
                  borderBottom: '1.5px solid currentColor',
                  transform: activeDropdown === 'shop' ? 'rotate(-135deg)' : 'rotate(45deg)',
                marginBottom: activeDropdown === 'shop' ? '-2px' : '2px',
                  transition: 'transform 0.2s ease',
                  opacity: 0.5,
                }} />
              </button>

              {activeDropdown === 'shop' && (
                <div
                  onMouseEnter={() => openDropdown('shop')}
                  onMouseLeave={scheduleClose}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 1rem)',
                    left: '50%',
                    transform: 'translateX(-40%)',
                    background: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '1rem',
                    padding: '1.25rem',
                    width: 520,
                    boxShadow: '0 16px 48px rgba(0,0,0,0.09), 0 4px 16px rgba(0,0,0,0.05)',
                    zIndex: 100,
                  }}
                >
                  {/* Caret */}
                  <div style={{
                    position: 'absolute',
                    top: -7,
                    left: '40%',
                    marginLeft: -7,
                    width: 13,
                    height: 13,
                    background: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderBottom: 'none',
                    borderRight: 'none',
                    transform: 'rotate(45deg)',
                  }} />

                  <p style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.35, margin: '0 0 1rem' }}>
                    Shop by product
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.375rem' }}>
                    {productTypes.map((t) => (
                      <Link
                        key={t.slug}
                        href={`/shop?type=${t.slug}`}
                        onClick={() => setActiveDropdown(null)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.625rem 0.375rem',
                          borderRadius: '0.625rem',
                          textDecoration: 'none',
                          color: 'var(--foreground)',
                          transition: 'background 0.1s',
                        }}
                        className="hover:bg-[var(--muted)]"
                      >
                        <div style={{
                          width: 76,
                          height: 76,
                          borderRadius: '0.5rem',
                          overflow: 'hidden',
                          background: 'var(--muted)',
                          flexShrink: 0,
                        }}>
                          <Image
                            src={t.img}
                            alt={t.label}
                            width={76}
                            height={76}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 500, textAlign: 'center', lineHeight: 1.3 }}>
                          {t.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', marginTop: '1rem', paddingTop: '0.75rem' }}>
                    <Link
                      href="/shop"
                      onClick={() => setActiveDropdown(null)}
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--foreground)',
                        textDecoration: 'none',
                        opacity: 0.4,
                      }}
                      className="hover:opacity-100 transition-opacity"
                    >
                      Shop all products →
                    </Link>
                  </div>
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
                border: '1.5px solid var(--accent-border)',
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
              style={{
                padding: '11px',
                margin: '-11px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
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

          <div style={{ borderTop: '1px solid var(--border)', margin: '0.25rem 0' }} />

          <MobileLink href="/about" onClick={() => setMenuOpen(false)}>About</MobileLink>

          <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.25rem', paddingTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
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
                border: '1.5px solid var(--accent-border)',
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
      style={{ fontSize: '1rem', fontWeight: 500, padding: '0.5rem 0', display: 'block', textAlign: 'right' }}
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
      style={{ fontSize: '0.9rem', padding: '0.6rem 0.75rem 0.6rem 0', display: 'block', borderRight: '2px solid var(--border)', textAlign: 'right' }}
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
          textAlign: 'right',
          color: 'var(--foreground)',
          fontFamily: 'var(--font-sans)',
          opacity: 0.8,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '0.4rem',
        }}
      >
        <span style={{
          display: 'inline-block',
          width: 7,
          height: 7,
          borderRight: '1.5px solid currentColor',
          borderBottom: '1.5px solid currentColor',
          transform: expanded ? 'rotate(45deg)' : 'rotate(-45deg)',
          transition: 'transform 0.2s ease',
          opacity: 0.45,
          flexShrink: 0,
          marginBottom: expanded ? '-3px' : '1px',
        }} />
        {label}
      </button>
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.25rem' }}>
          {children}
        </div>
      )}
    </div>
  )
}
