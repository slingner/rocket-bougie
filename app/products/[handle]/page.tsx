import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/Nav'
import ProductGallery from '@/components/ProductGallery'
import VariantSelector from '@/components/VariantSelector'
import { VariantImageProvider } from '@/components/VariantImageContext'
import StarRating from '@/components/StarRating'
import ProductCard from '@/components/ProductCard'
import { toCardVariants } from '@/lib/cardVariants'

interface ProductPageProps {
  params: Promise<{ handle: string }>
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rocketboogie.com'

export async function generateMetadata({ params }: ProductPageProps) {
  const { handle } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('products')
    .select('title, seo_title, seo_description, description, product_images(url, alt_text, position)')
    .eq('handle', handle)
    .eq('hidden', false)
    .single()

  if (!data) return {}

  const plainDescription = data.description
    ? data.description.replace(/<[^>]+>/g, '').slice(0, 160)
    : undefined

  const title = data.seo_title || `${data.title} | Rocket Boogie Co.`
  const description = data.seo_description || plainDescription
  const canonicalUrl = `${siteUrl}/products/${handle}`

  const images = [...(data.product_images ?? [])].sort((a, b) => a.position - b.position)
  const firstImage = images[0]

  const ogImageUrl = firstImage?.url ?? null

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Rocket Boogie Co.',
      type: 'website',
      images: ogImageUrl
        ? [{ url: ogImageUrl, alt: firstImage?.alt_text || data.title }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImageUrl ? [ogImageUrl] : [],
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { handle } = await params
  const supabase = await createClient()

  const { data: product, error } = await supabase
    .from('products')
    .select(`
      id,
      handle,
      title,
      description,
      product_type,
      tags,
      video_url,
      product_variants (
        id,
        option1_name,
        option1_value,
        option2_name,
        option2_value,
        price,
        compare_at_price,
        inventory_quantity,
        inventory_policy,
        image_id
      ),
      product_images!product_images_product_id_fkey (
        id,
        url,
        alt_text,
        position
      )
    `)
    .eq('handle', handle)
    .eq('hidden', false)
    .single()

  if (error || !product) notFound()

  // Related products: same product_type first, fill with tag overlap
  const { data: sameType } = await supabase
    .from('products')
    .select('id, handle, title, tags, thumbnail_image_id, product_variants(id, price, option1_name, option1_value, option2_value), product_images!product_images_product_id_fkey(id, url, alt_text, position)')
    .eq('hidden', false)
    .eq('product_type', product.product_type ?? '')
    .neq('id', product.id)
    .limit(4)

  const relatedById = new Map<string, typeof sameType extends (infer T)[] | null ? T : never>()
  for (const p of sameType ?? []) relatedById.set(p.id, p)

  if (relatedById.size < 4 && (product.tags ?? []).length > 0) {
    const { data: byTag } = await supabase
      .from('products')
      .select('id, handle, title, tags, thumbnail_image_id, product_variants(id, price, option1_name, option1_value, option2_value), product_images!product_images_product_id_fkey(id, url, alt_text, position)')
      .eq('hidden', false)
      .neq('id', product.id)
      .overlaps('tags', product.tags ?? [])
      .limit(8)
    for (const p of byTag ?? []) {
      if (relatedById.size >= 4) break
      if (!relatedById.has(p.id)) relatedById.set(p.id, p)
    }
  }

  const related = Array.from(relatedById.values()).slice(0, 4)

  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating, body, customer_name, created_at')
    .eq('product_id', product.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  const approvedReviews = reviews ?? []
  const reviewCount = approvedReviews.length
  const avgRating = reviewCount > 0
    ? approvedReviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviewCount
    : 0

  const images = [...(product.product_images ?? [])].sort(
    (a, b) => a.position - b.position
  )

  const relatedFirstImages = related.map(p => {
    const imgs = [...(p.product_images ?? [])].sort((a, b) => a.position - b.position)
    const thumb = p.thumbnail_image_id
      ? (imgs.find(img => img.id === p.thumbnail_image_id) ?? imgs[0])
      : imgs[0]
    return thumb?.url ?? null
  })

  const variants = product.product_variants ?? []
  const firstImageUrl = images[0]?.url ?? null

  // A product has real variant options if it has more than one variant,
  // or if its single variant isn't just the placeholder "Default Title"
  const hasVariants =
    variants.length > 1 ||
    (variants.length === 1 && variants[0].option1_name !== 'Title')

  const prices = variants.map(v => Number(v.price))
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const isInStock = variants.some(
    v => v.inventory_policy === 'continue' || (v.inventory_quantity ?? 0) > 0
  )
  const availability = isInStock
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock'
  const plainDescription = product.description
    ? product.description.replace(/<[^>]+>/g, '').trim()
    : undefined

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    ...(plainDescription && { description: plainDescription }),
    image: images.map(img => img.url),
    brand: { '@type': 'Brand', name: 'Rocket Boogie Co.' },
    url: `${siteUrl}/products/${product.handle}`,
    offers: prices.length === 1 || minPrice === maxPrice
      ? {
          '@type': 'Offer',
          price: minPrice.toFixed(2),
          priceCurrency: 'USD',
          availability,
          url: `${siteUrl}/products/${product.handle}`,
        }
      : {
          '@type': 'AggregateOffer',
          lowPrice: minPrice.toFixed(2),
          highPrice: maxPrice.toFixed(2),
          priceCurrency: 'USD',
          offerCount: variants.length,
          availability,
        },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav />
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem 1.5rem 6rem' }}>

        {/* Breadcrumb */}
        <nav style={{ marginBottom: '2rem', fontSize: '0.8rem', opacity: 0.45 }}>
          <Link
            href="/shop"
            className="no-underline"
            style={{ color: 'inherit' }}
          >
            Shop
          </Link>
          <span style={{ margin: '0 0.5rem' }}>›</span>
          <span>{product.title}</span>
        </nav>

        {/* Two-column layout */}
        <VariantImageProvider>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
            gap: 'clamp(2rem, 5vw, 5rem)',
            alignItems: 'start',
          }}
        >
          {/* Left: image gallery */}
          <ProductGallery images={images} title={product.title} videoUrl={product.video_url} />

          {/* Right: product info */}
          <div style={{ maxWidth: 500 }}>

            {/* Product type label */}
            {product.product_type && (
              <p
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  opacity: 0.38,
                  margin: '0 0 0.75rem',
                }}
              >
                {product.product_type}
              </p>
            )}

            {/* Title */}
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.75rem, 3vw, 2.75rem)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                margin: reviewCount > 0 ? '0 0 0.75rem' : '0 0 2rem',
              }}
            >
              {product.title}
            </h1>

            {/* Star rating summary — clicks scroll to the reviews section */}
            {reviewCount > 0 && (
              <a
                href="#reviews"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.75rem', textDecoration: 'none', color: 'inherit' }}
              >
                <StarRating rating={avgRating} size="sm" />
                <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>
                  {avgRating.toFixed(1)} · {reviewCount} review{reviewCount !== 1 ? 's' : ''}
                </span>
              </a>
            )}

            {/* Price, variants, add to cart */}
            <VariantSelector
              variants={variants}
              hasVariants={hasVariants}
              productId={product.id}
              handle={product.handle}
              title={product.title}
              imageUrl={firstImageUrl}
              images={images.map(img => ({ id: img.id, url: img.url }))}
              tags={product.tags ?? []}
            />

            {/* Description */}
            {product.description && (
              <div
                style={{
                  marginTop: '2.5rem',
                  paddingTop: '2rem',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <div
                  className="product-description"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}

            {/* Reviews */}
            {approvedReviews.length > 0 && (
              <div id="reviews" style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
                <h2 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.25rem',
                  fontWeight: 400,
                  letterSpacing: '-0.01em',
                  margin: '0 0 1.25rem',
                }}>
                  Reviews
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {approvedReviews.map((review, i) => (
                    <div key={i} style={{ paddingBottom: '1.25rem', borderBottom: i < approvedReviews.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
                        <StarRating rating={review.rating ?? 0} size="sm" />
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, opacity: 0.75 }}>{abbreviateName(review.customer_name)}</span>
                        <span style={{ fontSize: '0.75rem', opacity: 0.35 }}>
                          {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      {review.body && (
                        <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.7, opacity: 0.7 }}>{review.body}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        </VariantImageProvider>
      </main>

      {/* You May Also Like */}
      {related.length > 0 && (
        <section style={{
          borderTop: '1px solid var(--border)',
          padding: 'clamp(3rem, 6vw, 5rem) clamp(1.5rem, 5vw, 4rem)',
          background: 'var(--muted)',
        }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>

            {/* Heading row */}
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: '1rem',
              marginBottom: 'clamp(1.75rem, 3vw, 2.5rem)',
              flexWrap: 'wrap',
            }}>
              <h2 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                fontWeight: 400,
                fontStyle: 'italic',
                letterSpacing: '-0.02em',
                margin: 0,
              }}>
                You may also like
              </h2>
              <Link
                href="/shop"
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  opacity: 0.45,
                  textDecoration: 'none',
                  color: 'var(--foreground)',
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                }}
                className="hover:opacity-100"
              >
                Shop all →
              </Link>
            </div>

            {/* Product grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${related.length}, minmax(0, 1fr))`,
              gap: 'clamp(1rem, 2.5vw, 2rem)',
            }}>
              {related.map((p, i) => {
                const imgs = [...(p.product_images ?? [])].sort((a, b) => a.position - b.position)
                const relVariants = (p.product_variants ?? []) as { id: string; price: number; option1_name: string | null; option1_value: string | null; option2_value: string | null }[]
                const relPrice = relVariants.length > 0 ? Math.min(...relVariants.map((v) => Number(v.price))) : 0
                return (
                  <ProductCard
                    key={p.id}
                    handle={p.handle}
                    title={p.title}
                    price={relPrice}
                    imageUrl={relatedFirstImages[i] ?? null}
                    imageAlt={imgs[0]?.alt_text ?? null}
                    productId={p.id}
                    variants={toCardVariants(relVariants)}
                    tags={p.tags ?? []}
                  />
                )
              })}
            </div>
          </div>
        </section>
      )}
    </>
  )
}

// "Jane Smith" → "Jane S."
function abbreviateName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}
