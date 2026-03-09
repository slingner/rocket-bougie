import Link from 'next/link'

const SC_BASE = 'https://blrwnsdqucoudycjkjfq.supabase.co/storage/v1/object/public/product-images/products/859a850d-4603-473e-9e0d-e991217f6276'
const stickerImages = [
  { url: `${SC_BASE}/1.jpg`, alt: 'Rocket Boogie sticker pack' },
  { url: `${SC_BASE}/2.jpg`, alt: 'Rocket Boogie sticker pack' },
  { url: `${SC_BASE}/3.jpg`, alt: 'Rocket Boogie sticker pack' },
]

export default function StickerClubPromo() {
  return (
    <section style={{ padding: '0' }}>
      <style>{`
        .sc-promo-link { display: block; text-decoration: none; }
        .sc-promo-card {
          background: var(--background);
          border-radius: 1.5rem;
          border: 2px solid var(--accent);
          overflow: hidden;
          transition: box-shadow 0.3s ease;
        }
        .sc-promo-link:hover .sc-promo-card {
          box-shadow: 0 20px 60px rgba(0,0,0,0.12);
        }
        .sc-img { transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .sc-img-0 { transform: rotate(-11deg); }
        .sc-img-1 { transform: rotate(5deg); }
        .sc-img-2 { transform: rotate(-3deg); }
        .sc-promo-link:hover .sc-img-0 { transform: rotate(-15deg) translate(-8px, -10px); }
        .sc-promo-link:hover .sc-img-1 { transform: rotate(9deg) translate(6px, -8px); }
        .sc-promo-link:hover .sc-img-2 { transform: rotate(-6deg) translate(4px, -12px); }
        .sc-join-btn { transition: background 0.2s, color 0.2s; }
        .sc-promo-link:hover .sc-join-btn {
          background: var(--foreground) !important;
          color: var(--background) !important;
        }
        @media (max-width: 640px) {
          .sc-promo-card { grid-template-columns: 1fr !important; }
          .sc-img-panel { height: 200px; }
          .sc-text-panel { padding: 2.5rem 2rem !important; }
        }
      `}</style>

      <Link href="/sticker-club" className="sc-promo-link">
        <div className="sc-promo-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 260 }}>

          {/* Left — copy */}
          <div
            className="sc-text-panel"
            style={{
              padding: 'clamp(1.75rem, 3vw, 2.5rem) clamp(2rem, 4vw, 3.5rem)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '1rem',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
            }}>
              Monthly Subscription
            </span>

            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2.75rem, 5vw, 5rem)',
              fontWeight: 400,
              letterSpacing: '-0.04em',
              lineHeight: 0.92,
              color: 'var(--foreground)',
              margin: 0,
            }}>
              <em style={{ fontStyle: 'italic' }}>Sticker</em><br />
              Club
            </h2>

            <p style={{
              color: 'var(--foreground)',
              opacity: 0.5,
              fontSize: '0.9rem',
              lineHeight: 1.65,
              margin: 0,
              maxWidth: 300,
            }}>
              3 premium vinyl stickers, curated and shipped to your door every single month.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '2.75rem',
                color: 'var(--foreground)',
                letterSpacing: '-0.04em',
                lineHeight: 1,
              }}>
                $9
                <span style={{ fontSize: '1rem', opacity: 0.35, fontFamily: 'var(--font-sans)' }}>/mo</span>
              </span>
              <span
                className="sc-join-btn"
                style={{
                  background: 'var(--accent)',
                  color: '#161210',
                  padding: '0.7rem 1.5rem',
                  borderRadius: '100px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap',
                }}
              >
                Join now →
              </span>
            </div>
          </div>

          {/* Right — scattered images */}
          <div className="sc-img-panel" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to right, var(--background) 0%, transparent 30%)',
              zIndex: 2,
              pointerEvents: 'none',
            }} />

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={stickerImages[0].url} alt={stickerImages[0].alt} className="sc-img sc-img-0"
              style={{ position: 'absolute', width: 190, height: 190, objectFit: 'cover', borderRadius: '1rem', top: '50%', left: '0%', marginTop: -95, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 1 }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={stickerImages[1].url} alt={stickerImages[1].alt} className="sc-img sc-img-1"
              style={{ position: 'absolute', width: 210, height: 210, objectFit: 'cover', borderRadius: '1rem', top: '50%', left: '32%', marginTop: -105, boxShadow: '0 10px 40px rgba(0,0,0,0.55)', zIndex: 3 }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={stickerImages[2].url} alt={stickerImages[2].alt} className="sc-img sc-img-2"
              style={{ position: 'absolute', width: 185, height: 185, objectFit: 'cover', borderRadius: '1rem', top: '18%', right: '4%', boxShadow: '0 8px 28px rgba(0,0,0,0.45)', zIndex: 2 }}
            />
          </div>

        </div>
      </Link>
    </section>
  )
}
