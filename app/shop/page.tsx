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
  prints: ['print', 'mini-print'],
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

  const pageTitle = activeCollection
    ? activeCollection.charAt(0).toUpperCase() + activeCollection.slice(1)
    : activeType
    ? activeType.charAt(0).toUpperCase() + activeType.slice(1).replace('-', ' ')
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
          <p style={{ opacity: 0.5, fontSize: '0.875rem', margin: '0.5rem 0 0' }}>
            {displayProducts.length} product{displayProducts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Product grid */}
        {displayProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', opacity: 0.4 }}>
            <p>No products found.</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {displayProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
