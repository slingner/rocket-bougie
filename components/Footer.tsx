import Link from 'next/link'
import NewsletterForm from '@/components/NewsletterForm'
import FooterRocket from '@/components/FooterRocket'

const allLinks = [
  { label: 'Shop All',      href: '/shop' },
  { label: 'Cards',         href: '/shop?type=cards' },
  { label: 'Stickers',      href: '/shop?type=stickers' },
  { label: 'Prints',        href: '/shop?type=prints' },
  { label: 'About Us',      href: '/about' },
  { label: 'Events',        href: '/events' },
  { label: 'Wholesale',     href: '/wholesale' },
  { label: 'Contact',       href: '/contact' },
  { label: 'FAQ',           href: '/faq' },
  { label: 'Shipping',      href: '/shipping' },
  { label: 'Terms',         href: '/terms' },
  { label: 'Privacy',       href: '/privacy' },
  { label: 'Etsy',          href: 'https://www.etsy.com/shop/RocketBoogieCo?ref=profile_header', external: true },
]

const socialLinks = [
  {
    label: 'Instagram',
    href: 'https://instagram.com/rocketboogieco',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4.5" />
        <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: 'https://facebook.com/rocketboogieco',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 15, height: 15 }}>
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    label: 'TikTok',
    href: 'https://tiktok.com/@rocketboogie',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 15, height: 15 }}>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.28 8.28 0 0 0 4.84 1.55V6.79a4.85 4.85 0 0 1-1.07-.1z" />
      </svg>
    ),
  },
  {
    label: 'Pinterest',
    href: 'https://pinterest.com/rocketboogieco',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 15, height: 15 }}>
        <path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.39 9.29-.09-.78-.17-1.98.03-2.83.19-.77 1.27-5.38 1.27-5.38s-.32-.65-.32-1.61c0-1.51.88-2.64 1.97-2.64.93 0 1.38.7 1.38 1.54 0 .94-.6 2.34-.91 3.64-.26 1.09.54 1.97 1.6 1.97 1.92 0 3.4-2.02 3.4-4.95 0-2.59-1.86-4.4-4.52-4.4-3.08 0-4.89 2.31-4.89 4.7 0 .93.36 1.93.8 2.47.09.11.1.2.07.31-.08.33-.26 1.09-.3 1.24-.05.2-.16.24-.37.15-1.39-.65-2.26-2.68-2.26-4.32 0-3.51 2.55-6.74 7.36-6.74 3.86 0 6.86 2.75 6.86 6.42 0 3.83-2.41 6.9-5.76 6.9-1.13 0-2.19-.59-2.55-1.28l-.69 2.59c-.25.97-.93 2.18-1.39 2.92.05.02.1.03.15.04A10 10 0 0 0 22 12c0-5.52-4.48-10-10-10z" />
      </svg>
    ),
  },
]

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--background)' }}>
      <style>{`
        .ft-body {
          max-width: 1320px;
          margin: 0 auto;
          padding: 3rem 2.5rem 0;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: clamp(2.5rem, 5vw, 5rem);
          align-items: center;
        }
        .ft-right { display: flex; flex-direction: column; align-items: flex-end; }
        .ft-label {
          font-size: 0.62rem; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          opacity: 0.38; margin: 0 0 0.45rem;
        }
        .ft-sub {
          font-size: 0.73rem; opacity: 0.45;
          line-height: 1.65; margin: 0 0 0.9rem;
        }
        .ft-divider {
          max-width: 1320px;
          margin: 1.75rem auto 0;
          padding: 1rem 2.5rem;
          border-top: 1px solid var(--border);
          display: flex;
          flex-wrap: wrap;
          gap: 0.2rem 0;
          align-items: center;
        }
        .ft-nav-link {
          font-size: 0.71rem; opacity: 0.42;
          text-decoration: none; color: var(--foreground);
          transition: opacity 0.15s; white-space: nowrap;
          letter-spacing: 0.01em;
        }
        .ft-nav-link:hover { opacity: 0.85; }
        .ft-dot {
          font-size: 0.55rem; opacity: 0.3; padding: 0 0.45rem; user-select: none;
        }
        .ft-bottom {
          max-width: 1320px;
          margin: 0 auto;
          padding: 0.5rem 2.5rem 1.5rem;
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.25rem;
        }
        .ft-copy { font-size: 0.67rem; opacity: 0.28; margin: 0; letter-spacing: 0.01em; }

        @media (max-width: 720px) {
          .ft-body {
            grid-template-columns: 1fr;
            text-align: center;
            padding: 2rem 1.5rem 0;
          }
          .ft-body > *:first-child { order: 2; }
          .ft-body > *:nth-child(2) { order: 1; }
          .ft-body > *:last-child { order: 3; }
          .ft-right { align-items: center; }
          .ft-sub { text-align: center; }
          .ft-divider { padding: 0.875rem 1.5rem; justify-content: center; margin-top: 1.5rem; }
          .ft-bottom { padding: 0.5rem 1.5rem 1.25rem; justify-content: center; }
        }
      `}</style>

      {/* ── 3-col: brand | rocket | newsletter ── */}
      <div className="ft-body">

        {/* LEFT — brand + social */}
        <div>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', letterSpacing: '-0.02em', margin: '0 0 0.45rem' }}>
            Rocket Boogie Co.
          </p>
          <p style={{ fontSize: '0.75rem', opacity: 0.42, lineHeight: 1.65, margin: '0 0 1.25rem' }}>
            Handpainted art designed to make you smile,<br />made with love in San Francisco.
          </p>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {socialLinks.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                style={{
                  width: 28, height: 28,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '0.375rem', border: '1px solid var(--border)',
                  color: 'var(--foreground)', opacity: 0.48, textDecoration: 'none',
                  transition: 'opacity 0.15s',
                }}
                className="hover:opacity-100"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* CENTER — rocket */}
        <FooterRocket />

        {/* RIGHT — newsletter */}
        <div className="ft-right">
          <div style={{ maxWidth: 240, width: '100%' }}>
            <p className="ft-label">Stay in the loop</p>
            <p className="ft-sub">New designs, events, and the occasional surprise.</p>
            <NewsletterForm />
          </div>
        </div>

      </div>

      {/* ── Nav link strip ── */}
      <div className="ft-divider">
        {allLinks.map((l, i) => (
          <span key={l.label} style={{ display: 'contents' }}>
            <Link
              href={l.href}
              target={l.external ? '_blank' : undefined}
              rel={l.external ? 'noopener noreferrer' : undefined}
              className="ft-nav-link"
            >
              {l.label}
            </Link>
            {i < allLinks.length - 1 && <span className="ft-dot" aria-hidden="true">·</span>}
          </span>
        ))}
      </div>

      {/* ── Copyright ── */}
      <div className="ft-bottom">
        <p className="ft-copy">© {new Date().getFullYear()} Rocket Boogie Co.</p>
        <p className="ft-copy">Made with ♥ in San Francisco</p>
      </div>

    </footer>
  )
}
