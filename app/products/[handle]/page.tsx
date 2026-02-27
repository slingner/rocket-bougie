import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/Nav'
import ProductGallery from '@/components/ProductGallery'
import VariantSelector from '@/components/VariantSelector'

interface ProductPageProps {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { handle } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('products')
    .select('title, seo_title, seo_description, description')
    .eq('handle', handle)
    .eq('published', true)
    .single()

  if (!data) return {}

  const plainDescription = data.description
    ? data.description.replace(/<[^>]+>/g, '').slice(0, 160)
    : undefined

  return {
    title: data.seo_title || `${data.title} — Rocket Boogie Co.`,
    description: data.seo_description || plainDescription,
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

  return (
    <>
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
          <ProductGallery images={images} title={product.title} />

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
