import Link from 'next/link'
import NewsletterForm from '@/components/NewsletterForm'

const shopLinks = [
  { label: 'Shop All', href: '/shop' },
  { label: 'Greeting Cards', href: '/shop?type=cards' },
  { label: 'Stickers', href: '/shop?type=stickers' },
  { label: 'Sticker Packs', href: '/shop?type=sticker-packs' },
  { label: 'Prints', href: '/shop?type=prints' },
  { label: 'Etsy Shop', href: 'https://www.etsy.com/shop/RocketBoogieCo?ref=profile_header', external: true },
]

const helpLinks = [
  { label: 'Contact', href: '/contact' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Shipping', href: '/shipping' },
  { label: 'Refunds', href: '/refunds' },
  { label: 'Terms', href: '/terms' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Accessibility', href: '/accessibility' },
]

const aboutLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Wholesale', href: '/wholesale' },
  { label: 'Events', href: '/events' },
]

const socialLinks = [
  {
    label: 'Instagram',
    href: 'https://instagram.com/rocketboogieco',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
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
      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}>
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    label: 'TikTok',
    href: 'https://tiktok.com/@rocketboogie',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.28 8.28 0 0 0 4.84 1.55V6.79a4.85 4.85 0 0 1-1.07-.1z" />
      </svg>
    ),
  },
  {
    label: 'Pinterest',
    href: 'https://pinterest.com/rocketboogieco',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}>
        <path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.39 9.29-.09-.78-.17-1.98.03-2.83.19-.77 1.27-5.38 1.27-5.38s-.32-.65-.32-1.61c0-1.51.88-2.64 1.97-2.64.93 0 1.38.7 1.38 1.54 0 .94-.6 2.34-.91 3.64-.26 1.09.54 1.97 1.6 1.97 1.92 0 3.4-2.02 3.4-4.95 0-2.59-1.86-4.4-4.52-4.4-3.08 0-4.89 2.31-4.89 4.7 0 .93.36 1.93.8 2.47.09.11.1.2.07.31-.08.33-.26 1.09-.3 1.24-.05.2-.16.24-.37.15-1.39-.65-2.26-2.68-2.26-4.32 0-3.51 2.55-6.74 7.36-6.74 3.86 0 6.86 2.75 6.86 6.42 0 3.83-2.41 6.9-5.76 6.9-1.13 0-2.19-.59-2.55-1.28l-.69 2.59c-.25.97-.93 2.18-1.39 2.92.05.02.1.03.15.04A10 10 0 0 0 22 12c0-5.52-4.48-10-10-10z" />
      </svg>
    ),
  },
]

function LinkColumn({ heading, links }: {
  heading: string
  links: { label: string; href: string; external?: boolean }[]
}) {
  return (
    <div>
      <p style={{
        fontSize: '0.68rem',
        fontWeight: 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        opacity: 0.4,
        margin: '0 0 0.875rem',
      }}>
        {heading}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {links.map((l) => (
          <Link
            key={l.label}
            href={l.href}
            target={l.external ? '_blank' : undefined}
            rel={l.external ? 'noopener noreferrer' : undefined}
            style={{
              fontSize: '0.875rem',
              opacity: 0.65,
              textDecoration: 'none',
              color: 'var(--foreground)',
              transition: 'opacity 0.15s',
            }}
            className="hover:opacity-100"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--background)', padding: '3rem 1.5rem 2rem' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* ── MOBILE layout ── */}
        <div className="md:hidden flex flex-col" style={{ gap: '2rem', marginBottom: '2.5rem' }}>

          {/* Brand row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', letterSpacing: '-0.02em', margin: '0 0 0.4rem' }}>
                Rocket Boogie Co.
              </p>
              <p style={{ fontSize: '0.78rem', opacity: 0.5, lineHeight: 1.5, margin: 0, maxWidth: 180 }}>
                Art made with love in San Francisco.
              </p>
            </div>
            {/* Social icons stacked vertically in 2×2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', flexShrink: 0 }}>
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  style={{
                    width: 34, height: 34,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                    opacity: 0.55,
                    textDecoration: 'none',
                    transition: 'opacity 0.15s',
                  }}
                  className="hover:opacity-100"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Newsletter card */}
          <div style={{ border: '1.5px solid var(--border)', borderRadius: '1rem', padding: '1.25rem', background: 'var(--muted)' }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.4, margin: '0 0 0.4rem' }}>
              Stay in the loop
            </p>
            <p style={{ fontSize: '0.8rem', opacity: 0.55, margin: '0 0 0.875rem', lineHeight: 1.5 }}>
              New designs, events, and the occasional surprise.
            </p>
            <NewsletterForm />
          </div>

          {/* Links in 2-col grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <LinkColumn heading="Shop" links={shopLinks} />
            <LinkColumn heading="Help" links={helpLinks} />
          </div>
          <LinkColumn heading="About" links={aboutLinks} />
        </div>

        {/* ── DESKTOP layout ── */}
        <div
          className="hidden md:grid"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '2.5rem',
            marginBottom: '3rem',
          }}
        >
          {/* Brand */}
          <div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', letterSpacing: '-0.02em', margin: '0 0 0.75rem' }}>
              Rocket Boogie Co.
            </p>
            <p style={{ fontSize: '0.8rem', opacity: 0.55, lineHeight: 1.6, margin: '0 0 1.5rem', maxWidth: 200 }}>
              Handpainted art designed to make you smile, made with love in San Francisco.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  style={{
                    width: 34, height: 34,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                    opacity: 0.55,
                    textDecoration: 'none',
                    transition: 'opacity 0.15s, background 0.15s',
                    flexShrink: 0,
                  }}
                  className="hover:opacity-100 hover:bg-[var(--muted)]"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <LinkColumn heading="Shop" links={shopLinks} />
          <LinkColumn heading="Help" links={helpLinks} />
          <LinkColumn heading="About" links={aboutLinks} />

          {/* Newsletter */}
          <div style={{ border: '1.5px solid var(--border)', borderRadius: '1rem', padding: '1.25rem', background: 'var(--muted)' }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.4, margin: '0 0 0.5rem' }}>
              Stay in the loop
            </p>
            <p style={{ fontSize: '0.8rem', opacity: 0.55, margin: '0 0 0.875rem', lineHeight: 1.5 }}>
              New designs, events, and the occasional surprise.
            </p>
            <NewsletterForm />
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}>
          <p style={{ fontSize: '0.75rem', opacity: 0.4, margin: 0 }}>
            © {new Date().getFullYear()} Rocket Boogie Co.
          </p>
          <p style={{ fontSize: '0.75rem', opacity: 0.4, margin: 0 }}>
            Made with ♥ in San Francisco
          </p>
        </div>

      </div>
    </footer>
  )
}
