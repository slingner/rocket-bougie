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
  { label: 'Shipping Policy', href: '/shipping' },
  { label: 'Refund Policy', href: '/refunds' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Accessibility', href: '/accessibility' },
]

const aboutLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Wholesale', href: '/wholesale' },
  { label: 'Upcoming Events', href: '/events' },
]

const socialLinks = [
  { label: 'Instagram', href: 'https://instagram.com/rocketboogieco' },
  { label: 'Facebook', href: 'https://facebook.com/rocketboogieco' },
  { label: 'TikTok', href: 'https://tiktok.com/@rocketboogie' },
  { label: 'Pinterest', href: 'https://pinterest.com/rocketboogieco' },
]

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--background)',
        padding: '3rem 1.5rem 2rem',
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* Main columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '2.5rem',
            marginBottom: '3rem',
          }}
        >
          {/* Brand */}
          <div style={{ gridColumn: 'span 1' }}>
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.25rem',
                letterSpacing: '-0.02em',
                margin: '0 0 0.75rem',
              }}
            >
              Rocket Boogie Co.
            </p>
            <p
              style={{
                fontSize: '0.8rem',
                opacity: 0.55,
                lineHeight: 1.6,
                margin: '0 0 1.5rem',
                maxWidth: 200,
              }}
            >
              Art designed to make you smile, made with love in San Francisco.
            </p>

            {/* Social links */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    opacity: 0.5,
                    textDecoration: 'none',
                    color: 'var(--foreground)',
                    transition: 'opacity 0.15s',
                  }}
                  className="hover:opacity-100"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <p
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                opacity: 0.4,
                margin: '0 0 1rem',
              }}
            >
              Shop
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {shopLinks.map((l) => (
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

          {/* Help */}
          <div>
            <p
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                opacity: 0.4,
                margin: '0 0 1rem',
              }}
            >
              Help
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {helpLinks.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
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

          {/* About */}
          <div>
            <p
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                opacity: 0.4,
                margin: '0 0 1rem',
              }}
            >
              About
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {aboutLinks.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
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

          {/* Newsletter */}
          <div>
            <p
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                opacity: 0.4,
                margin: '0 0 1rem',
              }}
            >
              Stay in the loop
            </p>
            <p style={{ fontSize: '0.8rem', opacity: 0.55, margin: '0 0 0.875rem', lineHeight: 1.5 }}>
              New designs, events, and the occasional surprise.
            </p>
            <NewsletterForm />
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
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
