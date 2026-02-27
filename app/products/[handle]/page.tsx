import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/Nav'
import ProductGallery from '@/components/ProductGallery'
import VariantSelector from '@/components/VariantSelector'

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
    .eq('published', true)
    .single()

  if (!data) return {}

  const plainDescription = data.description
    ? data.description.replace(/<[^>]+>/g, '').slice(0, 160)
    : undefined

  const title = data.seo_title || `${data.title} — Rocket Boogie Co.`
  const description = data.seo_description || plainDescription
  const canonicalUrl = `${siteUrl}/products/${handle}`

  const images = [...(data.product_images ?? [])].sort((a, b) => a.position - b.position)
  const firstImage = images[0]

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
      images: firstImage
        ? [{ url: firstImage.url, alt: firstImage.alt_text || data.title }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: firstImage ? [firstImage.url] : [],
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
        price,
        compare_at_price,
        inventory_quantity,
        inventory_policy
      ),
      product_images (
        id,
        url,
        alt_text,
        position
      )
    `)
    .eq('handle', handle)
    .eq('published', true)
    .single()

  if (error || !product) notFound()

  const images = [...(product.product_images ?? [])].sort(
    (a, b) => a.position - b.position
  )

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
                margin: '0 0 2rem',
              }}
            >
              {product.title}
            </h1>

            {/* Price, variants, add to cart */}
            <VariantSelector
              variants={variants}
              hasVariants={hasVariants}
              productId={product.id}
              handle={product.handle}
              title={product.title}
              imageUrl={firstImageUrl}
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
          </div>
        </div>
      </main>
    </>
  )
}
