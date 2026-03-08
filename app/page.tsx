import Link from 'next/link'
import Image from 'next/image'
import Nav from '@/components/Nav'
import ProductCard from '@/components/ProductCard'
import { createClient } from '@/lib/supabase/server'
import { toCardVariants } from '@/lib/cardVariants'

type RawVariant = { id: string; price: number; option1_name: string | null; option1_value: string | null; option2_value: string | null }

function mapProduct(p: { id: string; handle: string; title: string; tags: string[] | null; product_variants: unknown; product_images: unknown }) {
  const rawVariants = (p.product_variants ?? []) as RawVariant[]
  const prices = rawVariants.map(v => v.price)
  const firstImage = (p.product_images as { url: string; alt_text: string | null; position: number }[] | null)
    ?.sort((a, b) => a.position - b.position)[0]
  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    price: prices.length > 0 ? Math.min(...prices) : 0,
    imageUrl: firstImage?.url ?? null,
    imageAlt: firstImage?.alt_text ?? null,
    productId: p.id,
    variants: toCardVariants(rawVariants),
    tags: p.tags ?? [],
  }
}

const PRODUCT_SELECT = `
  id, handle, title, tags,
  product_variants (id, price, option1_name, option1_value, option2_value),
  product_images!product_images_product_id_fkey (url, alt_text, position)
`
const HERO_URL = 'https://blrwnsdqucoudycjkjfq.supabase.co/storage/v1/object/public/product-images/site/hero.jpg'

export default async function HomePage() {
  const supabase = await createClient()

  // Run all queries in parallel
  const [{ data: products }, { data: printData }, { data: coverProducts }, { data: dbCollections }] = await Promise.all([
    supabase.from('products').select(PRODUCT_SELECT).eq('hidden', false).order('created_at', { ascending: false }).limit(8),
    supabase.from('products').select(PRODUCT_SELECT).eq('hidden', false).contains('tags', ['print']).limit(8),
    supabase.from('products').select('tags, product_images!product_images_product_id_fkey (url, position)').eq('hidden', false),
    supabase.from('collections').select('name, slug, tags, thumbnail_url').order('sort_order', { ascending: true }),
  ])

  const collections = (dbCollections ?? []).map(c => ({
    label: c.name as string,
    slug: c.slug as string,
    tags: c.tags as string[],
    thumbnail_url: c.thumbnail_url as string | null,
  }))

  const SC_BASE = 'https://blrwnsdqucoudycjkjfq.supabase.co/storage/v1/object/public/product-images/products/859a850d-4603-473e-9e0d-e991217f6276'
  const stickerImages = [
    { url: `${SC_BASE}/1.jpg`, alt_text: 'Rocket Boogie sticker pack' },
    { url: `${SC_BASE}/2.jpg`, alt_text: 'Rocket Boogie sticker pack' },
    { url: `${SC_BASE}/3.jpg`, alt_text: 'Rocket Boogie sticker pack' },
  ]

  const featured = (products ?? []).map(mapProduct)
  const prints   = (printData ?? []).map(mapProduct)

  const collectionCovers = collections.map((c) => {
    // Use the admin-set thumbnail if available, otherwise fall back to a matching product image
    if (c.thumbnail_url) return { ...c, imageUrl: c.thumbnail_url }
    const match = (coverProducts ?? []).find(
      (p) => p.tags?.some((t: string) => c.tags.includes(t)) && p.product_images?.length > 0
    )
    const image = match?.product_images
      ?.sort((a: { position: number }, b: { position: number }) => a.position - b.position)[0]
    return { ...c, imageUrl: image?.url ?? null }
  })


  return (
    <>
      <Nav />
      <main>

        {/* ── Hero ── */}
        <section
          style={{
            position: 'relative',
            width: '100%',
            height: 'clamp(480px, 72vh, 780px)',
            overflow: 'hidden',
          }}
        >
          {/* Background image */}
          <Image
            src={HERO_URL}
            alt="Chinese Baked Goods Print"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: 'cover', objectPosition: 'center', transform: 'scale(1.08)' }}
          />

          {/* Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to right, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.18) 100%)',
            }}
          />

          {/* Content */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              height: '100%',
              maxWidth: 1400,
              margin: '0 auto',
              padding: '0 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <p
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.6)',
                margin: '0 0 1.25rem',
              }}
            >
              Handmade in San Francisco
            </p>
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2.75rem, 6vw, 5.5rem)',
                fontWeight: 400,
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
                color: '#fff',
                margin: '0 0 1.5rem',
                maxWidth: 640,
              }}
            >
              Handpainted art designed to <br />make you smile.
            </h1>
            <p
              style={{
                fontSize: '1rem',
                color: 'rgba(255,255,255,0.72)',
                lineHeight: 1.65,
                margin: '0 0 2rem',
                maxWidth: 400,
              }}
            >
              Stickers, prints, and cards created in our studio, using <br />
              watercolor, gouache, and a whole lot of love.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link
                href="/shop"
                style={{
                  background: 'var(--accent)',
                  border: '1.5px solid var(--accent-border)',
                  color: 'var(--foreground)',
                  padding: '0.875rem 2rem',
                  borderRadius: '0.625rem',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'opacity 0.15s',
                }}
                className="hover:opacity-80"
              >
                Shop All
              </Link>
              <Link
                href="/about"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  padding: '0.875rem 2rem',
                  borderRadius: '0.625rem',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'opacity 0.15s',
                  backdropFilter: 'blur(8px)',
                }}
                className="hover:opacity-80"
              >
                Our story
              </Link>
            </div>
          </div>
        </section>

        {/* ── Collections ── */}
        <section style={{ background: 'var(--muted)', padding: 'clamp(2.5rem, 5vw, 4rem) 1.5rem' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                margin: '0 0 1.75rem',
              }}
            >
              Shop by collection
            </h2>
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                overflowX: 'auto',
                paddingBottom: '0.5rem',
                scrollbarWidth: 'none',
              }}
            >
              {collectionCovers.map((c) => (
                <Link
                  key={c.slug}
                  href={`/shop?collection=${c.slug}`}
                  className="group"
                  style={{
                    position: 'relative',
                    borderRadius: '1rem',
                    overflow: 'hidden',
                    textDecoration: 'none',
                    flexShrink: 0,
                    width: 160,
                    height: 160,
                    background: 'var(--border)',
                    display: 'block',
                  }}
                >
                  {c.imageUrl && (
                    <Image
                      src={c.imageUrl}
                      alt={c.label}
                      fill
                      sizes="160px"
                      className="group-hover:scale-110"
                      style={{ objectFit: 'cover', transition: 'transform 0.4s ease' }}
                    />
                  )}
                  {/* gradient + label */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)',
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '0.75rem',
                      left: 0,
                      right: 0,
                      textAlign: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#fff',
                      letterSpacing: '0.03em',
                    }}
                  >
                    {c.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Art Prints ── */}
        {prints.length > 0 && (
          <section style={{ padding: 'clamp(2.5rem, 5vw, 4rem) 1.5rem' }}>
            <div style={{ maxWidth: 1400, margin: '0 auto' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div>
                  <h2
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                      fontWeight: 400,
                      letterSpacing: '-0.02em',
                      margin: '0 0 0.375rem',
                    }}
                  >
                    Art Prints
                  </h2>
                  <p style={{ fontSize: '0.875rem', margin: 0 }}>
                    <span style={{ opacity: 0.5 }}>Watercolor originals, ready to frame.</span>
                    {' '}
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>From $24.</span>
                  </p>
                </div>
                <Link
                  href="/shop?type=prints"
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    opacity: 0.5,
                    textDecoration: 'none',
                    color: 'var(--foreground)',
                    transition: 'opacity 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                  className="hover:opacity-100"
                >
                  Shop all →
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {prints.map((p) => (
                  <ProductCard key={p.id} {...p} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Sticker Club promo ── */}
        {stickerImages.length > 0 && (
          <section style={{ padding: '0 1.5rem', margin: 'clamp(0rem, 2vw, 1rem) 0' }}>
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

            <div style={{ maxWidth: 1400, margin: '0 auto' }}>
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
                      4 premium vinyl stickers, curated and shipped to your door every single month.
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                      <span style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '2.75rem',
                        color: 'var(--foreground)',
                        letterSpacing: '-0.04em',
                        lineHeight: 1,
                      }}>
                        $15
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
                  <div
                    className="sc-img-panel"
                    style={{ position: 'relative', overflow: 'hidden' }}
                  >
                    {/* warm vignette from the left to blend with text side */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to right, var(--background) 0%, transparent 30%)',
                      zIndex: 2,
                      pointerEvents: 'none',
                    }} />

                    {stickerImages[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={stickerImages[0].url}
                        alt={stickerImages[0].alt_text ?? 'Sticker Club'}
                        className="sc-img sc-img-0"
                        style={{
                          position: 'absolute',
                          width: 190, height: 190,
                          objectFit: 'cover',
                          borderRadius: '1rem',
                          top: '50%', left: '0%',
                          marginTop: -95,
                          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                          zIndex: 1,
                        }}
                      />
                    )}
                    {stickerImages[1] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={stickerImages[1].url}
                        alt={stickerImages[1].alt_text ?? 'Sticker Club'}
                        className="sc-img sc-img-1"
                        style={{
                          position: 'absolute',
                          width: 210, height: 210,
                          objectFit: 'cover',
                          borderRadius: '1rem',
                          top: '50%', left: '32%',
                          marginTop: -105,
                          boxShadow: '0 10px 40px rgba(0,0,0,0.55)',
                          zIndex: 3,
                        }}
                      />
                    )}
                    {stickerImages[2] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={stickerImages[2].url}
                        alt={stickerImages[2].alt_text ?? 'Sticker Club'}
                        className="sc-img sc-img-2"
                        style={{
                          position: 'absolute',
                          width: 185, height: 185,
                          objectFit: 'cover',
                          borderRadius: '1rem',
                          top: '18%', right: '4%',
                          boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
                          zIndex: 2,
                        }}
                      />
                    )}
                  </div>

                </div>
              </Link>
            </div>
          </section>
        )}

        {/* ── Product types ── */}
        <section style={{ padding: 'clamp(2.5rem, 5vw, 4rem) 1.5rem' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '1.75rem',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                  fontWeight: 400,
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                New arrivals
              </h2>
              <Link
                href="/shop"
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  opacity: 0.5,
                  textDecoration: 'none',
                  color: 'var(--foreground)',
                  transition: 'opacity 0.15s',
                }}
                className="hover:opacity-100"
              >
                View all →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {featured.map((p) => (
                <ProductCard key={p.id} {...p} />
              ))}
            </div>
          </div>
        </section>

        {/* ── About blurb ── */}
        <section
          style={{
            background: 'var(--muted)',
            padding: 'clamp(3rem, 6vw, 5rem) 1.5rem',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <p
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                opacity: 0.4,
                margin: '0 0 1.25rem',
              }}
            >
              Our story
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                margin: '0 0 1.25rem',
              }}
            >
              We believe the little things can turn an ordinary day into something that makes you smile.
            </h2>
            <p
              style={{
                fontSize: '0.9rem',
                opacity: 0.6,
                lineHeight: 1.7,
                margin: '0 0 2rem',
              }}
            >
              As a husband-and-wife team, we design and illustrate together, passing sketches across the dining table, and then bringing it all to life in our studio with watercolor and gouache paint.
            </p>
            <Link
              href="/about"
              style={{
                background: 'var(--foreground)',
                color: 'var(--background)',
                padding: '0.875rem 2rem',
                borderRadius: '0.625rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-block',
                transition: 'opacity 0.15s',
              }}
              className="hover:opacity-75"
            >
              Meet the makers
            </Link>
          </div>
        </section>

      </main>
    </>
  )
}
