import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/Nav'
import ProductGrid from '@/components/ProductGrid'
import StickerClubPromo from '@/components/StickerClubPromo'
import { toCardVariants } from '@/lib/cardVariants'

const typeTagMap: Record<string, string[]> = {
  stickers: ['sticker'],
  'sticker-packs': ['sticker-pack'],
  prints: ['print'],
  'mini-prints': ['mini-print'],
  cards: ['greeting-card'],
}

const cardCategories = [
  { label: 'All Cards', slug: null },
  { label: 'Birthday', slug: 'birthday' },
  { label: 'Celebration', slug: 'celebration' },
  { label: 'Encouragement', slug: 'encouragement' },
  { label: 'Love', slug: 'love' },
  { label: 'Moms & Dads', slug: 'moms-and-dads' },
  { label: 'Sympathy', slug: 'sympathy' },
  { label: 'Thank You', slug: 'thank-you' },
  { label: 'Fun', slug: 'fun' },
]

const PAGE_SIZE = 24

interface SearchParams {
  collection?: string
  type?: string
  cardCategory?: string
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const from = 0
  const to   = PAGE_SIZE - 1

  // Load collections from DB for filtering
  const { data: dbCollections } = await supabase
    .from('collections')
    .select('slug, name, tags, title_uppercase')
    .order('sort_order', { ascending: true })
  const collectionTagMap = Object.fromEntries(
    (dbCollections ?? []).map(c => [c.slug, c.tags as string[]])
  )
  const collectionMetaMap = Object.fromEntries(
    (dbCollections ?? []).map(c => [c.slug, { name: c.name as string, title_uppercase: c.title_uppercase as boolean }])
  )

  let query = supabase
    .from('products')
    .select(`
      id,
      handle,
      title,
      tags,
      thumbnail_image_id,
      product_variants (id, price, option1_name, option1_value, option2_value),
      product_images!product_images_product_id_fkey (id, url, alt_text, position)
    `, { count: 'exact' })
    .eq('hidden', false)
    .order('created_at', { ascending: false })

  if (params.collection && collectionTagMap[params.collection]) {
    query = query.overlaps('tags', collectionTagMap[params.collection])
  }

  if (params.type && typeTagMap[params.type]) {
    query = query.overlaps('tags', typeTagMap[params.type])
  }

  if (params.type === 'cards' && params.cardCategory) {
    query = query.contains('tags', [params.cardCategory])
  }

  query = query.range(from, to)

  const { data: products, count, error } = await query

  if (error) {
    console.error('Error fetching products:', error)
  }

  const totalCount = count ?? 0

  const displayProducts = (products ?? []).map((p) => {
    const rawVariants = (p.product_variants ?? []) as {
      id: string; price: number; option1_name: string | null
      option1_value: string | null; option2_value: string | null
    }[]
    const prices = rawVariants.map((v) => v.price)
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0
    const sortedImages = p.product_images
      ?.slice().sort((a: { position: number }, b: { position: number }) => a.position - b.position) ?? []
    const thumbnailImage = p.thumbnail_image_id
      ? (sortedImages.find((img: { id: string }) => img.id === p.thumbnail_image_id) ?? sortedImages[0])
      : sortedImages[0]
    const firstImage = thumbnailImage
    const cardVariants = toCardVariants(rawVariants)

    return {
      id: p.id,
      handle: p.handle,
      title: p.title,
      price: minPrice,
      imageUrl: firstImage?.url ?? null,
      imageAlt: firstImage?.alt_text ?? null,
      productId: p.id,
      variants: cardVariants,
      tags: p.tags ?? [],
    }
  })


  const activeCollection = params.collection ?? null
  const activeType = params.type ?? null
  const activeCardCategory = params.cardCategory ?? null

  const typeTitleMap: Record<string, string> = {
    stickers: 'Stickers',
    'sticker-packs': 'Sticker Packs',
    prints: 'Prints',
    'mini-prints': 'Mini Prints',
    cards: 'Greeting Cards',
  }

  const activeCardCategoryLabel = cardCategories.find(c => c.slug === activeCardCategory)?.label

  const activeCollectionMeta = activeCollection ? collectionMetaMap[activeCollection] : null
  const pageTitle = activeCollection
    ? (activeCollectionMeta?.name ?? (activeCollection.charAt(0).toUpperCase() + activeCollection.slice(1)))
    : activeType
    ? (typeTitleMap[activeType] ?? activeType)
    : 'All Products'
  const pageTitleUppercase = activeCollectionMeta?.title_uppercase ?? false

  const showCardSidebar = activeType === 'cards'

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
              letterSpacing: pageTitleUppercase ? '0.06em' : '-0.02em',
              textTransform: pageTitleUppercase ? 'uppercase' : 'none',
            }}
          >
            {activeCardCategoryLabel && activeCardCategoryLabel !== 'All Cards'
              ? `${activeCardCategoryLabel} Cards`
              : pageTitle}
          </h1>
          {activeType === 'mini-prints' ? (
            <p style={{ fontSize: '0.875rem', margin: '0.5rem 0 0' }}>
              <span style={{ opacity: 0.5 }}>Small art prints that double as postcards, blank on the back and ready to mail.</span>
              {' '}
              <span style={{ opacity: 0.4 }}>{totalCount} product{totalCount !== 1 ? 's' : ''}</span>
            </p>
          ) : (
            <p style={{ opacity: 0.5, fontSize: '0.875rem', margin: '0.5rem 0 0' }}>
              {totalCount} product{totalCount !== 1 ? 's' : ''}
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

        {/* Content area — sidebar + grid when cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: showCardSidebar ? '168px 1fr' : '1fr',
          gap: showCardSidebar ? '3rem' : 0,
          alignItems: 'start',
        }}>

          {/* Card category sidebar */}
          {showCardSidebar && (
            <nav aria-label="Card categories" style={{ position: 'sticky', top: '5rem' }}>
              <p style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.35, margin: '0 0 0.75rem' }}>
                Category
              </p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                {cardCategories.map((cat) => {
                  const isActive = cat.slug === activeCardCategory || (cat.slug === null && !activeCardCategory)
                  const href = cat.slug ? `/shop?type=cards&cardCategory=${cat.slug}` : '/shop?type=cards'
                  return (
                    <li key={cat.slug ?? 'all'}>
                      <Link href={href} style={{ display: 'block', padding: '0.4rem 0.625rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: isActive ? 600 : 400, color: 'var(--foreground)', textDecoration: 'none', opacity: isActive ? 1 : 0.5, background: isActive ? 'var(--muted)' : 'transparent', transition: 'opacity 0.1s, background 0.1s' }}>
                        {cat.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          )}

          {/* Product grid with infinite scroll */}
          {totalCount === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', opacity: 0.4 }}>
              <p>No products found.</p>
            </div>
          ) : (
            <ProductGrid
              key={`${activeCollection}-${activeType}-${activeCardCategory}`}
              initialProducts={displayProducts}
              totalCount={totalCount}
              filterParams={{
                collectionTags: activeCollection ? collectionTagMap[activeCollection] : undefined,
                typeTags: activeType ? typeTagMap[activeType] : undefined,
                cardCategory: activeCardCategory ?? undefined,
              }}
              columns={showCardSidebar ? 'three' : 'four'}
            >
              {activeType === 'stickers' && (
                <div style={{ marginTop: '3rem' }}>
                  <StickerClubPromo />
                </div>
              )}
            </ProductGrid>
          )}
        </div>

      </main>
    </>
  )
}
