import Nav from '@/components/Nav'
import SubscribeButton from './SubscribeButton'

export const metadata = {
  title: 'Monthly Sticker Club | Rocket Boogie',
  description: 'Three original stickers a month, a note from the artists, and a shop discount. From Tammy and Scott at Rocket Boogie Co.',
}

const PERKS = [
  { label: '3 stickers a month', sub: 'Waterproof vinyl, picked by us from our original artwork' },
  { label: 'A note from us', sub: 'A short letter from Tammy and Scott tucked in every pack' },
  { label: '10% off the shop', sub: 'A fresh discount code with every delivery' },
  { label: 'Early access', sub: 'First look at new releases before they go live' },
]

const SC_BASE = 'https://blrwnsdqucoudycjkjfq.supabase.co/storage/v1/object/public/product-images/products/859a850d-4603-473e-9e0d-e991217f6276'
const images = [1,2,3,4,5,6,7,8,9].map((n, i) => ({
  id: String(n),
  url: `${SC_BASE}/${n}.jpg`,
  alt_text: 'Rocket Boogie sticker pack',
  position: i + 1,
}))

export default async function StickerClubPage() {

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sc-fade { animation: fadeUp 0.6s ease both; }
        .sc-img-wrap {
          break-inside: avoid;
          margin-bottom: 0.875rem;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          display: block;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .sc-img-wrap:hover {
          transform: scale(1.025) !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.14);
        }
        .sc-img-wrap img {
          width: 100%;
          display: block;
          object-fit: cover;
        }
        .sc-img-wrap:nth-child(3n+1) { transform: rotate(-1.4deg); }
        .sc-img-wrap:nth-child(3n+2) { transform: rotate(1.1deg); }
        .sc-img-wrap:nth-child(3n+3) { transform: rotate(-0.6deg); }
        .sticker-club-description p { margin: 0 0 1rem; opacity: 0.75; }
        .sticker-club-description p:first-child { font-size: 1.15rem; font-family: var(--font-serif); letter-spacing: -0.01em; opacity: 1; }
        .perk-card {
          border: 1px solid var(--border);
          border-radius: 0.875rem;
          padding: 1.25rem 1.5rem;
          background: var(--background);
          transition: border-color 0.2s;
        }
        .perk-card:hover { border-color: var(--foreground); }
      `}</style>

      <Nav />
      <main>

        {/* Hero */}
        <section style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '4.5rem 1.5rem 3rem',
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: '3rem',
          alignItems: 'end',
        }}>
          <div>
            <p
              className="sc-fade"
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                opacity: 0.4,
                margin: '0 0 1.25rem',
              }}
            >
              Monthly Subscription
            </p>

            <h1
              className="sc-fade"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(3rem, 7vw, 5.5rem)',
                fontWeight: 400,
                letterSpacing: '-0.04em',
                lineHeight: 0.95,
                margin: '0 0 2rem',
                animationDelay: '80ms',
              }}
            >
              Rocket Boogie<br />
              <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>Sticker Club</em>
            </h1>

            <div
              className="sc-fade"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                flexWrap: 'wrap',
                animationDelay: '160ms',
              }}
            >
              <div>
                <span style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '2.5rem',
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                }}>
                  $9
                </span>
                <span style={{ fontSize: '0.85rem', opacity: 0.45, marginLeft: '0.4rem' }}>/ month</span>
              </div>
              <SubscribeButton />
            </div>

            <p
              className="sc-fade"
              style={{
                fontSize: '0.78rem',
                opacity: 0.35,
                marginTop: '1rem',
                animationDelay: '240ms',
              }}
            >
              Secure checkout via Stripe · Cancel any time
            </p>
          </div>

          {images.length >= 2 && (
            <div
              className="sc-fade"
              style={{
                position: 'relative',
                width: 200,
                height: 220,
                flexShrink: 0,
                animationDelay: '200ms',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[1].url}
                alt={images[1].alt_text ?? ''}
                style={{
                  position: 'absolute',
                  top: 0, right: 0,
                  width: 160, height: 160,
                  objectFit: 'cover',
                  borderRadius: '1rem',
                  transform: 'rotate(6deg)',
                  boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
                }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[0].url}
                alt={images[0].alt_text ?? ''}
                style={{
                  position: 'absolute',
                  bottom: 0, left: 0,
                  width: 160, height: 160,
                  objectFit: 'cover',
                  borderRadius: '1rem',
                  transform: 'rotate(-4deg)',
                  boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
                }}
              />
            </div>
          )}
        </section>

        {/* Divider */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem' }}>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />
        </div>

        {/* Image gallery */}
        {images.length > 0 && (
          <section style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem' }}>
            <p style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              opacity: 0.35,
              marginBottom: '1.5rem',
            }}>
              Past packs &amp; previews
            </p>
            <div style={{ columns: 3, columnGap: '0.875rem' }}>
              {images.map((img) => (
                <div key={img.id} className="sc-img-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.alt_text ?? 'Rocket Boogie sticker pack'}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Perks */}
        <section style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 1.5rem 4rem',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '0.75rem',
          }}>
            {PERKS.map(({ label, sub }, i) => (
              <div key={label} className="perk-card">
                <div style={{
                  width: 28, height: 28,
                  background: 'var(--accent)',
                  borderRadius: '50%',
                  marginBottom: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--foreground)',
                }}>
                  {i + 1}
                </div>
                <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: '0 0 0.25rem', letterSpacing: '-0.01em' }}>
                  {label}
                </p>
                <p style={{ fontSize: '0.8rem', opacity: 0.5, margin: 0, lineHeight: 1.5 }}>
                  {sub}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Description */}
        <section style={{
          background: 'var(--muted)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            maxWidth: 680,
            margin: '0 auto',
            padding: '4rem 1.5rem',
          }}>
            <p style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              opacity: 0.35,
              marginBottom: '1.5rem',
            }}>
              From Tammy &amp; Scott
            </p>
            <div className="sticker-club-description" style={{ fontSize: '1.05rem', lineHeight: 1.75, color: 'var(--foreground)' }}>
              <p>We draw everything ourselves. Every sticker in the club comes from our original artwork, made by the two of us.</p>
              <p>
                Each month we pick three stickers we love and send them your way. Sometimes it&apos;s a theme, sometimes it&apos;s just whatever we&apos;ve been obsessed with lately. You&apos;ll get a little note from us tucked inside with every pack. Nothing too long, just a quick hello and what we&apos;ve been up to.
              </p>
              <p>
                We have a big catalog and we try to keep things fresh, but eventually you might see a design twice. It&apos;ll take a while.
              </p>
              <p>
                Every pack also includes a 10% discount code for the shop, good until your next one arrives. Nine dollars a month, free US shipping, cancel whenever you want.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '5rem 1.5rem 6rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '2rem',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 400,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            margin: 0,
          }}>
            A little piece of our studio,<br />every month.
          </h2>
          <SubscribeButton />
        </section>

      </main>
    </>
  )
}
