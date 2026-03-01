import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/Nav'
import ProductCard from '@/components/ProductCard'

const collectionTagMap: Record<string, string[]> = {
  california: ['california'],
  food: ['food'],
  ocean: ['ocean'],
  pets: ['pets'],
  space: ['space'],
}

const typeTagMap: Record<string, string[]> = {
  stickers: ['sticker'],
  'sticker-packs': ['sticker-pack'],
  prints: ['print'],
  'mini-prints': ['mini-print'],
  cards: ['greeting-card'],
}

interface SearchParams {
  collection?: string
  type?: string
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Fetch all published products with their cheapest variant price and first image
  let query = supabase
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

  const { data: products, error } = await query

  if (error) {
    console.error('Error fetching products:', error)
  }

  // Filter by collection or type tag client-side (simpler than complex Supabase array queries)
  let filtered = products ?? []

  if (params.collection && collectionTagMap[params.collection]) {
    const matchTags = collectionTagMap[params.collection]
    filtered = filtered.filter((p) =>
      p.tags?.some((tag: string) => matchTags.includes(tag))
    )
  }

  if (params.type && typeTagMap[params.type]) {
    const matchTags = typeTagMap[params.type]
    filtered = filtered.filter((p) =>
      p.tags?.some((tag: string) => matchTags.includes(tag))
    )
  }

  // Build display data
  const displayProducts = filtered.map((p) => {
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

  const activeCollection = params.collection ?? null
  const activeType = params.type ?? null

  const typeTitleMap: Record<string, string> = {
    stickers: 'Stickers',
    'sticker-packs': 'Sticker Packs',
    prints: 'Prints',
    'mini-prints': 'Mini Prints',
    cards: 'Greeting Cards',
  }

  const pageTitle = activeCollection
    ? activeCollection.charAt(0).toUpperCase() + activeCollection.slice(1)
    : activeType
    ? (typeTitleMap[activeType] ?? activeType)
    : 'All Products'

  return (
    <>
      <Nav />
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 400,
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            {pageTitle}
          </h1>
          {activeType === 'mini-prints' ? (
            <p style={{ fontSize: '0.875rem', margin: '0.5rem 0 0' }}>
              <span style={{ opacity: 0.5 }}>Small art prints that double as postcards, blank on the back and ready to mail.</span>
              {' '}
              <span style={{ opacity: 0.4 }}>{displayProducts.length} product{displayProducts.length !== 1 ? 's' : ''}</span>
            </p>
          ) : (
            <p style={{ opacity: 0.5, fontSize: '0.875rem', margin: '0.5rem 0 0' }}>
              {displayProducts.length} product{displayProducts.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Deal banners */}
        {activeType === 'stickers' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              alignItems: 'center',
              gap: '2rem',
              background: 'var(--muted)',
              borderRadius: '1rem',
              padding: '1.5rem 2rem',
              marginBottom: '2.5rem',
              borderLeft: '3px solid var(--accent)',
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
                  fontWeight: 400,
                  letterSpacing: '-0.02em',
                  margin: '0 0 0.3rem',
                  lineHeight: 1.2,
                }}
              >
                Buy any 3 stickers, get one free
              </p>
              <p style={{ fontSize: '0.825rem', opacity: 0.5, margin: 0, lineHeight: 1.5 }}>
                Mix and match freely. Discount applied automatically at checkout.
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                  fontWeight: 400,
                  color: 'var(--accent)',
                  margin: 0,
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                  filter: 'brightness(0.78)',
                }}
              >
                1 free
              </p>
              <p
                style={{
                  fontSize: '0.7rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  opacity: 0.4,
                  margin: '0.2rem 0 0',
                  fontWeight: 600,
                }}
              >
                with any 3
              </p>
            </div>
          </div>
        )}

        {activeType === 'mini-prints' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              alignItems: 'center',
              gap: '2rem',
              background: 'var(--muted)',
              borderRadius: '1rem',
              padding: '1.5rem 2rem',
              marginBottom: '2.5rem',
              borderLeft: '3px solid var(--accent)',
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
                  fontWeight: 400,
                  letterSpacing: '-0.02em',
                  margin: '0 0 0.3rem',
                  lineHeight: 1.2,
                }}
              >
                Mix &amp; match any 4 mini prints
              </p>
              <p style={{ fontSize: '0.825rem', opacity: 0.5, margin: 0, lineHeight: 1.5 }}>
                Discount applied automatically at checkout, no code needed.
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                  fontWeight: 400,
                  color: 'var(--accent)',
                  margin: 0,
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                  filter: 'brightness(0.78)',
                }}
              >
                $16
              </p>
              <p
                style={{
                  fontSize: '0.7rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  opacity: 0.4,
                  margin: '0.2rem 0 0',
                  fontWeight: 600,
                }}
              >
                for any 4
              </p>
            </div>
          </div>
        )}

        {/* Product grid */}
        {displayProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', opacity: 0.4 }}>
            <p>No products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
