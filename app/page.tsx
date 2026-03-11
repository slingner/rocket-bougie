import Link from 'next/link'
import Image from 'next/image'
import Nav from '@/components/Nav'
import ProductCard from '@/components/ProductCard'
import { createClient } from '@/lib/supabase/server'
import { toCardVariants } from '@/lib/cardVariants'
import { getActiveBanner } from '@/lib/seasonal'

type RawVariant = { id: string; price: number; option1_name: string | null; option1_value: string | null; option2_value: string | null }

function mapProduct(p: { id: string; handle: string; title: string; tags: string[] | null; thumbnail_image_id?: string | null; product_variants: unknown; product_images: unknown }) {
  const rawVariants = (p.product_variants ?? []) as RawVariant[]
  const prices = rawVariants.map(v => v.price)
  const sortedImages = (p.product_images as { id: string; url: string; alt_text: string | null; position: number }[] | null)
    ?.slice().sort((a, b) => a.position - b.position) ?? []
  const thumbnail = p.thumbnail_image_id
    ? (sortedImages.find(img => img.id === p.thumbnail_image_id) ?? sortedImages[0])
    : sortedImages[0]
  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    price: prices.length > 0 ? Math.min(...prices) : 0,
    imageUrl: thumbnail?.url ?? null,
    imageAlt: thumbnail?.alt_text ?? null,
    productId: p.id,
    variants: toCardVariants(rawVariants),
    tags: p.tags ?? [],
  }
}

const PRODUCT_SELECT = `
  id, handle, title, tags, thumbnail_image_id,
  product_variants (id, price, option1_name, option1_value, option2_value),
  product_images!product_images_product_id_fkey (id, url, alt_text, position)
`
const DEFAULT_HERO_URL = 'https://blrwnsdqucoudycjkjfq.supabase.co/storage/v1/object/public/product-images/site/hero.jpg'

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: products }, { data: printData }, { data: coverProducts }, { data: dbCollections }, banner] = await Promise.all([
    supabase.from('products').select(PRODUCT_SELECT).eq('hidden', false).order('created_at', { ascending: false }).limit(8),
    supabase.from('products').select(PRODUCT_SELECT).eq('hidden', false).contains('tags', ['print']).limit(8),
    supabase.from('products').select('tags, product_images!product_images_product_id_fkey (url, position)').eq('hidden', false),
    supabase.from('collections').select('name, slug, tags, thumbnail_url').eq('hidden', false).order('sort_order', { ascending: true }),
    getActiveBanner(),
  ])

  const collections = (dbCollections ?? []).map(c => ({
    label: c.name as string,
    slug: c.slug as string,
    tags: c.tags as string[],
    thumbnail_url: c.thumbnail_url as string | null,
  }))

  const featured = (products ?? []).map(mapProduct)
  const prints   = (printData ?? []).map(mapProduct)

  const collectionCovers = collections.map((c) => {
    if (c.thumbnail_url) return { ...c, imageUrl: c.thumbnail_url }
    const match = (coverProducts ?? []).find(
      (p) => p.tags?.some((t: string) => c.tags.includes(t)) && p.product_images?.length > 0
    )
    const image = match?.product_images
      ?.sort((a: { position: number }, b: { position: number }) => a.position - b.position)[0]
    return { ...c, imageUrl: image?.url ?? null }
  })

  // Resolve banner values, falling back to defaults
  const heroImage = banner?.hero_image_url ?? DEFAULT_HERO_URL
  const heroHeadline = banner?.hero_headline ?? 'Handpainted art designed to make you smile.'
  const heroSubtext = banner?.hero_subtext ?? 'Stickers, prints, and cards created in our studio, using watercolor, gouache, and a whole lot of love.'
  const heroCtaLabel = banner?.hero_cta_label ?? 'Shop All'
  const heroCtaUrl = banner?.hero_cta_url ?? '/shop'

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
          <Image
            src={heroImage}
            alt={heroHeadline}
            fill
            priority
            sizes="100vw"
            style={{ objectFit: 'cover', objectPosition: 'center', transform: 'scale(1.08)' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to right, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.18) 100%)',
            }}
          />
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
              {heroHeadline}
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
              {heroSubtext}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link
                href={heroCtaUrl}
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
                {heroCtaLabel}
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

        {/* ── Seasonal Feature ── */}
        {banner?.feature_headline && (
          <>
            <style>{`
              .seasonal-feature-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                min-height: clamp(360px, 50vh, 560px);
              }
              @media (max-width: 640px) {
                .seasonal-feature-grid {
                  grid-template-columns: 1fr;
                }
                .seasonal-feature-img {
                  order: -1;
                }
              }
            `}</style>
            <section style={{ overflow: 'hidden' }}>
              <div className="seasonal-feature-grid">
                {/* Text */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: 'clamp(2.5rem, 6vw, 5rem) clamp(1.5rem, 5vw, 4.5rem)',
                    background: 'var(--muted)',
                  }}
                >
                  <p
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      opacity: 0.4,
                      margin: '0 0 1.25rem',
                    }}
                  >
                    {banner.name}
                  </p>
                  <h2
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 'clamp(2rem, 4vw, 3.25rem)',
                      fontWeight: 400,
                      letterSpacing: '-0.025em',
                      lineHeight: 1.1,
                      margin: '0 0 1.25rem',
                      maxWidth: '18ch',
                    }}
                  >
                    {banner.feature_headline}
                  </h2>
                  {banner.feature_subtext && (
                    <p
                      style={{
                        fontSize: '0.95rem',
                        lineHeight: 1.65,
                        opacity: 0.6,
                        margin: '0 0 2rem',
                        maxWidth: '40ch',
                      }}
                    >
                      {banner.feature_subtext}
                    </p>
                  )}
                  {banner.feature_cta_url && (
                    <div>
                      <Link
                        href={banner.feature_cta_url}
                        style={{
                          display: 'inline-block',
                          background: 'var(--foreground)',
                          color: 'var(--background)',
                          padding: '0.875rem 2rem',
                          borderRadius: '0.625rem',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                          transition: 'opacity 0.15s',
                        }}
                        className="hover:opacity-75"
                      >
                        {banner.feature_cta_label ?? 'Shop now'}
                      </Link>
                    </div>
                  )}
                </div>

                {/* Image */}
                {banner.feature_image_url ? (
                  <div
                    className="seasonal-feature-img"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
                  >
                    <Image
                      src={banner.feature_image_url}
                      alt={banner.feature_headline}
                      width={0}
                      height={0}
                      sizes="(max-width: 640px) 100vw, 50vw"
                      style={{ width: '100%', height: 'auto' }}
                    />
                  </div>
                ) : (
                  /* No image: accent color block */
                  <div
                    style={{
                      background: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0.25,
                    }}
                  />
                )}
              </div>
            </section>
          </>
        )}

        {/* ── New Arrivals ── */}
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
                    <span style={{ opacity: 0.5 }}>Created after our original watercolor paintings.</span>
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
