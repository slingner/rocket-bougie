import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/Nav'
import SubscribeButton from './SubscribeButton'

export const metadata = {
  title: 'Monthly Sticker Club | Rocket Boogie',
  description: 'A curated pack of 4 premium Rocket Boogie stickers delivered to your door every month.',
}

const PERKS = [
  { label: '4 stickers / month', sub: 'Premium vinyl, mix of sizes' },
  { label: 'New themes monthly', sub: 'Ocean, food, animals, cities & more' },
  { label: 'Free US shipping', sub: 'Delivered right to your door' },
  { label: 'Cancel any time', sub: 'No commitments, no tricks' },
]

export default async function StickerClubPage() {
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('id, title, description, product_images ( id, url, position, alt_text )')
    .eq('handle', 'rocket-boogie-monthly-sticker-club')
    .maybeSingle()

  const images = ((product?.product_images ?? []) as { id: string; url: string; position: number; alt_text: string | null }[])
    .sort((a, b) => a.position - b.position)

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
        .sticker-club-description ul { padding-left: 1.25rem; margin: 0.5rem 0 1rem; }
        .sticker-club-description li { margin-bottom: 0.4rem; opacity: 0.75; }
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

        {/* ── Hero ──────────────────────────────────────────────────── */}
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
                  $15
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

          {/* Stacked preview — top 2 images as a teaser */}
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

        {/* ── Divider ───────────────────────────────────────────────── */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem' }}>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />
        </div>

        {/* ── Image gallery ─────────────────────────────────────────── */}
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

        {/* ── Perks ─────────────────────────────────────────────────── */}
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

        {/* ── Description ───────────────────────────────────────────── */}
        {product?.description && (
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
                What&rsquo;s the deal
              </p>
              <div
                dangerouslySetInnerHTML={{ __html: product.description }}
                style={{ fontSize: '1.05rem', lineHeight: 1.75, color: 'var(--foreground)' }}
                className="sticker-club-description"
              />
            </div>
          </section>
        )}

        {/* ── Bottom CTA ────────────────────────────────────────────── */}
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
            A little joy,<br />every month.
          </h2>
          <SubscribeButton />
        </section>

      </main>
    </>
  )
}
