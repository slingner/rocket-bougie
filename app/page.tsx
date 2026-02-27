import Link from 'next/link'
import Image from 'next/image'
import Nav from '@/components/Nav'
import ProductCard from '@/components/ProductCard'
import { createClient } from '@/lib/supabase/server'

const collections = [
  { label: 'California', slug: 'california', emoji: '🌉' },
  { label: 'Food & Friends', slug: 'food', emoji: '🍜' },
  { label: 'Ocean', slug: 'ocean', emoji: '🐋' },
  { label: 'Pets', slug: 'pets', emoji: '🐾' },
  { label: 'Space', slug: 'space', emoji: '🚀' },
]

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch a handful of featured products for the homepage grid
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

  return (
    <>
      <Nav />
      <main>

        {/* ── Hero ── */}
        <section
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            padding: 'clamp(3rem, 8vw, 6rem) 1.5rem clamp(2rem, 5vw, 4rem)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
            gap: '3rem',
            alignItems: 'center',
          }}
        >
          <div>
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
              Handmade in San Francisco
            </p>
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2.75rem, 6vw, 5rem)',
                fontWeight: 400,
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
                margin: '0 0 1.5rem',
              }}
            >
              Art that makes<br />you smile.
            </h1>
            <p
              style={{
                fontSize: '1rem',
                opacity: 0.6,
                lineHeight: 1.65,
                margin: '0 0 2rem',
                maxWidth: 400,
              }}
            >
              Stickers, prints, and cards born from a dining table in SF.
              Watercolor, gouache, and a whole lot of love.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link
                href="/shop"
                style={{
                  background: 'var(--accent)',
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
                  background: 'var(--muted)',
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
                Our story
              </Link>
            </div>
          </div>

          {/* Hero product collage */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
              maxWidth: 500,
              marginLeft: 'auto',
            }}
          >
            {featured.slice(0, 4).map((p, i) => (
              <Link
                key={p.id}
                href={`/products/${p.handle}`}
                style={{ textDecoration: 'none' }}
                className="group"
              >
                <div
                  style={{
                    background: 'var(--muted)',
                    borderRadius: '0.875rem',
                    overflow: 'hidden',
                    aspectRatio: '1 / 1',
                    position: 'relative',
                    // Offset every other card slightly for visual interest
                    marginTop: i % 2 === 1 ? '1.5rem' : 0,
                  }}
                >
                  {p.imageUrl ? (
                    <Image
                      src={p.imageUrl}
                      alt={p.imageAlt || p.title}
                      fill
                      sizes="(max-width: 768px) 40vw, 20vw"
                      style={{ objectFit: 'cover', transition: 'transform 0.4s ease' }}
                      className="group-hover:scale-105"
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', opacity: 0.2 }}>🚀</div>
                  )}
                </div>
              </Link>
            ))}
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
                gap: '0.75rem',
                overflowX: 'auto',
                paddingBottom: '0.5rem',
                scrollbarWidth: 'none',
              }}
            >
              {collections.map((c) => (
                <Link
                  key={c.slug}
                  href={`/shop?collection=${c.slug}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '1.25rem 1.5rem',
                    background: 'var(--background)',
                    borderRadius: '1rem',
                    textDecoration: 'none',
                    color: 'var(--foreground)',
                    minWidth: 120,
                    flexShrink: 0,
                    transition: 'background 0.15s',
                    border: '1px solid var(--border)',
                  }}
                  className="hover:bg-[var(--accent)]"
                >
                  <span style={{ fontSize: '1.75rem' }}>{c.emoji}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {c.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

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

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '1.5rem',
              }}
            >
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
              Scott and Tammy create from a dining table in San Francisco — watercolor, gouache,
              and digital tools combining into cards, stickers, and prints that find their way
              across the country.
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
