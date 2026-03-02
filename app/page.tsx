import Link from 'next/link'
import Image from 'next/image'
import Nav from '@/components/Nav'
import ProductCard from '@/components/ProductCard'
import { createClient } from '@/lib/supabase/server'

const collections = [
  { label: 'California', slug: 'california', tags: ['california'] },
  { label: 'Food & Friends', slug: 'food', tags: ['food'] },
  { label: 'Ocean', slug: 'ocean', tags: ['ocean'] },
  { label: 'Pets', slug: 'pets', tags: ['pets'] },
  { label: 'Space', slug: 'space', tags: ['space'] },
]

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch featured products for homepage grid
  const { data: products } = await supabase
    .from('products')
    .select(`
      id,
      handle,
      title,
      tags,
      product_variants (price),
      product_images (url, alt_text, position)
    `)
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(8)

  const featured = (products ?? []).map((p) => {
    const prices = p.product_variants?.map((v: { price: number }) => v.price) ?? []
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0
    const firstImage = p.product_images
      ?.sort((a: { position: number }, b: { position: number }) => a.position - b.position)[0]
    return {
      id: p.id,
      handle: p.handle,
      title: p.title,
      price: minPrice,
      imageUrl: firstImage?.url ?? null,
      imageAlt: firstImage?.alt_text ?? null,
    }
  })

  // Fetch art prints for featured strip
  const { data: printData } = await supabase
    .from('products')
    .select(`
      id,
      handle,
      title,
      product_variants (price),
      product_images (url, alt_text, position)
    `)
    .eq('published', true)
    .contains('tags', ['print'])
    .limit(8)

  const prints = (printData ?? []).map((p) => {
    const prices = p.product_variants?.map((v: { price: number }) => v.price) ?? []
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0
    const firstImage = p.product_images
      ?.sort((a: { position: number }, b: { position: number }) => a.position - b.position)[0]
    return {
      id: p.id,
      handle: p.handle,
      title: p.title,
      price: minPrice,
      imageUrl: firstImage?.url ?? null,
      imageAlt: firstImage?.alt_text ?? null,
    }
  })

  // Fetch one cover image per collection
  const { data: coverProducts } = await supabase
    .from('products')
    .select('tags, product_images (url, position)')
    .eq('published', true)

  const collectionCovers = collections.map((c) => {
    const match = (coverProducts ?? []).find(
      (p) => p.tags?.some((t: string) => c.tags.includes(t)) &&
             p.product_images?.length > 0
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
            src="https://blrwnsdqucoudycjkjfq.supabase.co/storage/v1/object/public/product-images/site/hero.jpg"
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
              Art designed to <br />make you smile.
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
                  borderRadius: '100px',
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
                  borderRadius: '100px',
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
                      style={{ objectFit: 'cover', transition: 'transform 0.4s ease' }}
                      className="group-hover:scale-110"
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
                borderRadius: '100px',
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
