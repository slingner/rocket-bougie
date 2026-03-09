'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { useCart } from '@/lib/cart'
import { createClient } from '@/lib/supabase/client'
import SearchOverlay from './SearchOverlay'

type NavCollection = { label: string; slug: string; img: string | null }

const IMG = 'https://blrwnsdqucoudycjkjfq.supabase.co/storage/v1/object/public/product-images/products'

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
  const [searchOpen, setSearchOpen] = useState(false)
  const { itemCount } = useCart()
  const [loggedIn, setLoggedIn] = useState(false)
  const [collections, setCollections] = useState<NavCollection[]>([])
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [collectionsHighlight, setCollectionsHighlight] = useState<NavCollection | null>(null)
  const [shopHighlight, setShopHighlight] = useState<(typeof productTypes)[0] | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session)
    })
    supabase
      .from('collections')
      .select('name, slug, thumbnail_url')
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data) setCollections(data.map(c => ({ label: c.name, slug: c.slug, img: c.thumbnail_url })))
      })
    return () => subscription.unsubscribe()
  }, [])

  function openDropdown(key: DropdownKey) {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setActiveDropdown(key)
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setActiveDropdown(null), 150)
  }

  const collectionsImg = collectionsHighlight?.img ?? collections[0]?.img ?? null
  const collectionsLabel = collectionsHighlight?.label ?? collections[0]?.label ?? ''
  const shopImg = shopHighlight?.img ?? productTypes[0].img
  const shopLabel = shopHighlight?.label ?? productTypes[0].label

  return (
    <header
      style={{ borderBottom: '1px solid var(--border)', background: 'var(--background)', position: 'relative' }}
      className="sticky top-0 z-50"
    >
      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .mega-dropdown {
          animation: dropdownIn 0.18s ease-out forwards;
        }
        .mega-link-row {
          transition: background 0.1s ease, padding-left 0.12s ease;
        }
        .mega-link-row:hover {
          background: var(--muted);
          padding-left: 1.375rem !important;
        }
      `}</style>

      <div className="max-w-[1400px] mx-auto px-6">
        {/* Mobile bar */}
        <div className="flex md:hidden items-center justify-between h-16">
          <Link href="/" className="shrink-0" style={{ lineHeight: 0 }}>
            <Image src="/logo.png" alt="Rocket Boogie Co." width={560} height={312} style={{ height: 44, width: 'auto' }} priority />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link
              href="/cart"
              aria-label={`Cart, ${itemCount} item${itemCount !== 1 ? 's' : ''}`}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: 'var(--accent)', border: '1.5px solid var(--accent-border)',
                padding: '0.4rem 0.75rem', borderRadius: '0.625rem',
                color: 'var(--foreground)', textDecoration: 'none',
              }}
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} style={{ width: 16, height: 16 }}>
                <path d="M6.5 8V6a3.5 3.5 0 0 1 7 0v2" strokeLinecap="round" />
                <rect x="2.5" y="8" width="15" height="10" rx="2" />
              </svg>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{itemCount > 0 ? itemCount : 'Cart'}</span>
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu"
              style={{ padding: '11px', margin: '-11px', background: 'none', border: 'none', cursor: 'pointer' }}>
              <div style={{ width: 22, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ height: 2, background: 'var(--foreground)', display: 'block', borderRadius: 2 }} />
                <span style={{ height: 2, background: 'var(--foreground)', display: 'block', borderRadius: 2 }} />
                <span style={{ height: 2, background: 'var(--foreground)', display: 'block', borderRadius: 2, width: menuOpen ? '100%' : '70%' }} />
              </div>
            </button>
          </div>
        </div>

        {/* Desktop bar */}
        <div className="h-16 hidden md:grid" style={{ gridTemplateColumns: '1fr auto 1fr', alignItems: 'center' }}>

          {/* Logo */}
          <Link href="/" className="shrink-0" style={{ lineHeight: 0 }}>
            <Image src="/logo.png" alt="Rocket Boogie Co." width={560} height={312} style={{ height: 52, width: 'auto' }} priority />
          </Link>

          {/* Desktop nav — triggers only, no dropdown panels here */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/shop" style={{ fontSize: '0.875rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em' }}
              className="text-foreground opacity-70 hover:opacity-100 transition-opacity no-underline">
              Shop All
            </Link>

            {/* Collections trigger */}
            <div
              onMouseEnter={() => openDropdown('collections')}
              onMouseLeave={scheduleClose}
            >
              <button
                aria-haspopup="true"
                aria-expanded={activeDropdown === 'collections'}
                style={{
                  fontSize: '0.875rem', fontWeight: 500, background: 'none', border: 'none',
                  cursor: 'pointer', opacity: activeDropdown === 'collections' ? 1 : 0.7,
                  fontFamily: 'var(--font-sans)', color: 'var(--foreground)', padding: 0,
                  transition: 'opacity 0.15s', display: 'flex', alignItems: 'center', gap: '0.3rem',
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                }}
              >
                Collections
                <span style={{
                  display: 'inline-block', width: 6, height: 6,
                  borderRight: '1.5px solid currentColor', borderBottom: '1.5px solid currentColor',
                  transform: activeDropdown === 'collections' ? 'rotate(-135deg)' : 'rotate(45deg)',
                  marginBottom: activeDropdown === 'collections' ? '-2px' : '2px',
                  transition: 'transform 0.2s ease', opacity: 0.5,
                }} />
              </button>
            </div>

            {/* Products trigger */}
            <div
              onMouseEnter={() => openDropdown('shop')}
              onMouseLeave={scheduleClose}
            >
              <button
                aria-haspopup="true"
                aria-expanded={activeDropdown === 'shop'}
                style={{
                  fontSize: '0.875rem', fontWeight: 500, background: 'none', border: 'none',
                  cursor: 'pointer', opacity: activeDropdown === 'shop' ? 1 : 0.7,
                  fontFamily: 'var(--font-sans)', color: 'var(--foreground)', padding: 0,
                  transition: 'opacity 0.15s', display: 'flex', alignItems: 'center', gap: '0.3rem',
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                }}
              >
                Products
                <span style={{
                  display: 'inline-block', width: 6, height: 6,
                  borderRight: '1.5px solid currentColor', borderBottom: '1.5px solid currentColor',
                  transform: activeDropdown === 'shop' ? 'rotate(-135deg)' : 'rotate(45deg)',
                  marginBottom: activeDropdown === 'shop' ? '-2px' : '2px',
                  transition: 'transform 0.2s ease', opacity: 0.5,
                }} />
              </button>
            </div>

            <Link href="/about" style={{ fontSize: '0.875rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em' }}
              className="text-foreground opacity-70 hover:opacity-100 transition-opacity no-underline">
              About
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3" style={{ justifySelf: 'end' }}>
            <button onClick={() => setSearchOpen(true)} aria-label="Search"
              className="hidden md:flex opacity-50 hover:opacity-100 transition-opacity"
              style={{ alignItems: 'center', justifyContent: 'center', padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground)' }}>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} style={{ width: 18, height: 18 }}>
                <circle cx="8.5" cy="8.5" r="5.5" />
                <line x1="13" y1="13" x2="17.5" y2="17.5" />
              </svg>
            </button>
            <Link href={loggedIn ? '/account' : '/account/login'} style={{ fontSize: '0.875rem', fontWeight: 500 }}
              className="text-foreground opacity-70 hover:opacity-100 transition-opacity no-underline hidden md:block">
              {loggedIn ? 'Account' : 'Sign in'}
            </Link>
            <Link href="/cart"
              aria-label={`Cart, ${itemCount} item${itemCount !== 1 ? 's' : ''}`}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'var(--accent)', border: '1.5px solid var(--accent-border)',
                padding: '0.45rem 1rem 0.45rem 0.75rem', borderRadius: '0.625rem',
                color: 'var(--foreground)', textDecoration: 'none', transition: 'opacity 0.15s', position: 'relative',
              }}
              className="hidden md:flex hover:opacity-80"
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} style={{ width: 16, height: 16, flexShrink: 0 }}>
                <path d="M6.5 8V6a3.5 3.5 0 0 1 7 0v2" strokeLinecap="round" />
                <rect x="2.5" y="8" width="15" height="10" rx="2" />
              </svg>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, lineHeight: 1 }}>Cart</span>
              {itemCount > 0 && (
                <span style={{
                  background: 'var(--foreground)', color: 'var(--background)', borderRadius: '100px',
                  fontSize: '0.7rem', fontWeight: 700, minWidth: '1.25rem', height: '1.25rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 0.3rem', lineHeight: 1,
                }}>
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* ── Collections panel — anchored to header bottom, no gap ── */}
      {activeDropdown === 'collections' && (
        <div
          className="mega-dropdown hidden md:flex"
          onMouseEnter={() => openDropdown('collections')}
          onMouseLeave={scheduleClose}
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 620,
            background: 'var(--background)',
            border: '1px solid var(--border)',
            borderTop: 'none',
            borderRadius: '0 0 1.25rem 1.25rem',
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0,0,0,0.12), 0 6px 20px rgba(0,0,0,0.06)',
            zIndex: 100,
          }}
        >
          {/* Left: hero image */}
          <div style={{ width: 210, flexShrink: 0, position: 'relative', background: 'var(--muted)', overflow: 'hidden', minHeight: 300 }}>
            {collectionsImg && (
              <Image
                key={collectionsImg}
                src={collectionsImg}
                alt={collectionsLabel}
                fill
                style={{ objectFit: 'cover' }}
                sizes="210px"
              />
            )}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%',
              background: 'linear-gradient(to top, rgba(26,26,26,0.72) 0%, transparent 100%)',
              pointerEvents: 'none',
            }} />
            <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem' }}>
              <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: '0.2rem' }}>
                Collection
              </span>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontStyle: 'italic', color: '#fff', margin: 0, lineHeight: 1.2, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
                {collectionsLabel}
              </p>
            </div>
          </div>

          {/* Right: links */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.5rem 0 1.25rem' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.3, margin: '0 0 0.875rem', paddingLeft: '1.25rem' }}>
              Shop by collection
            </p>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
              {collections.map((c) => (
                <Link
                  key={c.slug}
                  href={`/shop?collection=${c.slug}`}
                  onClick={() => setActiveDropdown(null)}
                  onMouseEnter={() => setCollectionsHighlight(c)}
                  className="mega-link-row"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    paddingLeft: '1.25rem', paddingRight: '1.25rem',
                    paddingTop: '0.6rem', paddingBottom: '0.6rem',
                    borderRadius: '0.5rem', marginLeft: '0.5rem', marginRight: '0.5rem',
                    textDecoration: 'none', color: 'var(--foreground)',
                  }}
                >
                  <span style={{ fontSize: '1rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</span>
                  <span style={{ opacity: 0.25, fontSize: '0.9rem' }}>→</span>
                </Link>
              ))}
            </div>
            <div style={{ marginTop: '0.75rem', paddingTop: '0.875rem', borderTop: '1px solid var(--border)', paddingLeft: '1.75rem', paddingRight: '1.25rem' }}>
              <Link href="/shop" onClick={() => setActiveDropdown(null)}
                style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground)', textDecoration: 'none', opacity: 0.4, letterSpacing: '0.01em' }}
                className="hover:opacity-100 transition-opacity">
                Shop all collections →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Products panel — anchored to header bottom, no gap ── */}
      {activeDropdown === 'shop' && (
        <div
          className="mega-dropdown hidden md:flex"
          onMouseEnter={() => openDropdown('shop')}
          onMouseLeave={scheduleClose}
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 560,
            background: 'var(--background)',
            border: '1px solid var(--border)',
            borderTop: 'none',
            borderRadius: '0 0 1.25rem 1.25rem',
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0,0,0,0.12), 0 6px 20px rgba(0,0,0,0.06)',
            zIndex: 100,
          }}
        >
          {/* Left: hero image */}
          <div style={{ width: 200, flexShrink: 0, position: 'relative', background: 'var(--muted)', overflow: 'hidden', minHeight: 280 }}>
            <Image key={shopImg} src={shopImg} alt={shopLabel} fill style={{ objectFit: 'cover' }} sizes="200px" />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%',
              background: 'linear-gradient(to top, rgba(26,26,26,0.72) 0%, transparent 100%)',
              pointerEvents: 'none',
            }} />
            <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem' }}>
              <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: '0.2rem' }}>
                Product type
              </span>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontStyle: 'italic', color: '#fff', margin: 0, lineHeight: 1.2, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
                {shopLabel}
              </p>
            </div>
          </div>

          {/* Right: links */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.5rem 0 1.25rem' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.3, margin: '0 0 0.875rem', paddingLeft: '1.25rem' }}>
              Shop by product
            </p>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
              {productTypes.map((t) => (
                <Link
                  key={t.slug}
                  href={`/shop?type=${t.slug}`}
                  onClick={() => setActiveDropdown(null)}
                  onMouseEnter={() => setShopHighlight(t)}
                  className="mega-link-row"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    paddingLeft: '1.25rem', paddingRight: '1.25rem',
                    paddingTop: '0.6rem', paddingBottom: '0.6rem',
                    borderRadius: '0.5rem', marginLeft: '0.5rem', marginRight: '0.5rem',
                    textDecoration: 'none', color: 'var(--foreground)',
                  }}
                >
                  <span style={{ fontSize: '1rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.label}</span>
                  <span style={{ opacity: 0.25, fontSize: '0.9rem' }}>→</span>
                </Link>
              ))}
            </div>
            <div style={{ marginTop: '0.75rem', paddingTop: '0.875rem', borderTop: '1px solid var(--border)', paddingLeft: '1.75rem', paddingRight: '1.25rem' }}>
              <Link href="/shop" onClick={() => setActiveDropdown(null)}
                style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground)', textDecoration: 'none', opacity: 0.4, letterSpacing: '0.01em' }}
                className="hover:opacity-100 transition-opacity">
                Shop all products →
              </Link>
            </div>
          </div>
        </div>
      )}

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ borderTop: '1px solid var(--border)', background: 'var(--background)' }}
          className="md:hidden px-6 py-4 flex flex-col gap-1">
          <MobileLink href="/shop" onClick={() => setMenuOpen(false)}>Shop All</MobileLink>
          <MobileExpandable label="Collections" expanded={mobileExpanded === 'collections'}
            onToggle={() => setMobileExpanded(mobileExpanded === 'collections' ? null : 'collections')}>
            {collections.map((c) => (
              <MobileSubLink key={c.slug} href={`/shop?collection=${c.slug}`} onClick={() => setMenuOpen(false)}>{c.label}</MobileSubLink>
            ))}
          </MobileExpandable>
          <MobileExpandable label="Products" expanded={mobileExpanded === 'shop'}
            onToggle={() => setMobileExpanded(mobileExpanded === 'shop' ? null : 'shop')}>
            {productTypes.map((t) => (
              <MobileSubLink key={t.slug} href={`/shop?type=${t.slug}`} onClick={() => setMenuOpen(false)}>{t.label}</MobileSubLink>
            ))}
          </MobileExpandable>
          <div style={{ borderTop: '1px solid var(--border)', margin: '0.25rem 0' }} />
          <MobileLink href="/about" onClick={() => setMenuOpen(false)}>About</MobileLink>
          <button onClick={() => { setMenuOpen(false); setSearchOpen(true) }}
            style={{ fontSize: '1.375rem', fontWeight: 500, padding: '0.5rem 0', display: 'block', width: '100%', textAlign: 'right', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground)', fontFamily: 'inherit', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Search
          </button>
          <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.25rem', paddingTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Link href={loggedIn ? '/account' : '/account/login'}
              style={{ fontSize: '0.875rem', fontWeight: 500, opacity: 0.6 }}
              className="text-foreground no-underline" onClick={() => setMenuOpen(false)}>
              {loggedIn ? 'Account' : 'Sign in'}
            </Link>
            <Link href="/cart"
              style={{ fontSize: '0.875rem', fontWeight: 600, background: 'var(--accent)', border: '1.5px solid var(--accent-border)', padding: '0.4rem 1rem', borderRadius: '0.625rem', color: 'var(--foreground)' }}
              className="no-underline" onClick={() => setMenuOpen(false)}>
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
    <Link href={href} onClick={onClick}
      style={{ fontSize: '1.375rem', fontWeight: 500, padding: '0.5rem 0', display: 'block', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.06em' }}
      className="text-foreground no-underline opacity-80 hover:opacity-100">
      {children}
    </Link>
  )
}

function MobileSubLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick}
      style={{ fontSize: '1.125rem', padding: '0.5rem 0.75rem 0.5rem 0', display: 'block', borderRight: '2px solid var(--border)', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.05em' }}
      className="text-foreground no-underline opacity-65 hover:opacity-100">
      {children}
    </Link>
  )
}

function MobileExpandable({ label, expanded, onToggle, children }: {
  label: string; expanded: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div>
      <button onClick={onToggle}
        style={{ fontSize: '1.375rem', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem 0', width: '100%', textAlign: 'right', color: 'var(--foreground)', fontFamily: 'var(--font-sans)', opacity: 0.8, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        <span style={{
          display: 'inline-block', width: 7, height: 7,
          borderRight: '1.5px solid currentColor', borderBottom: '1.5px solid currentColor',
          transform: expanded ? 'rotate(45deg)' : 'rotate(-45deg)',
          transition: 'transform 0.2s ease', opacity: 0.45, flexShrink: 0,
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
