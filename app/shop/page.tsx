import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/Nav'
import ProductGrid from '@/components/ProductGrid'
import ProductCard from '@/components/ProductCard'
import StickerClubPromo from '@/components/StickerClubPromo'
import ShopControls from '@/components/ShopControls'
import { toCardVariants } from '@/lib/cardVariants'

const typeTagMap: Record<string, string[]> = {
  stickers: ['sticker'],
  'sticker-packs': ['sticker-pack'],
  prints: ['print'],
  'mini-prints': ['mini-print'],
  cards: ['greeting-card'],
}

const typeSections = [
  { slug: 'stickers',      label: 'Stickers',       tags: ['sticker'] },
  { slug: 'sticker-packs', label: 'Sticker Packs',  tags: ['sticker-pack'] },
  { slug: 'prints',        label: 'Prints',          tags: ['print'] },
  { slug: 'mini-prints',   label: 'Mini Prints',     tags: ['mini-print'] },
  { slug: 'cards',         label: 'Greeting Cards',  tags: ['greeting-card'] },
]

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

const PRODUCT_SELECT = `
  id, handle, title, tags, thumbnail_image_id,
  product_variants (id, price, option1_name, option1_value, option2_value),
  product_images!product_images_product_id_fkey (id, url, alt_text, position)
`

type RawVariant = { id: string; price: number; option1_name: string | null; option1_value: string | null; option2_value: string | null }
type RawImage   = { id: string; url: string; alt_text: string | null; position: number }

function mapProduct(p: {
  id: string; handle: string; title: string; tags: string[] | null; thumbnail_image_id?: string | null
  product_variants: unknown; product_images: unknown
}) {
  const variants  = (p.product_variants ?? []) as RawVariant[]
  const images    = ((p.product_images ?? []) as RawImage[]).sort((a, b) => a.position - b.position)
  const thumbnail = p.thumbnail_image_id ? (images.find(i => i.id === p.thumbnail_image_id) ?? images[0]) : images[0]
  const prices    = variants.map(v => v.price)
  return {
    id: p.id, handle: p.handle, title: p.title,
    price: prices.length ? Math.min(...prices) : 0,
    imageUrl: thumbnail?.url ?? null,
    imageAlt: thumbnail?.alt_text ?? null,
    productId: p.id,
    variants: toCardVariants(variants),
    tags: p.tags ?? [],
  }
}

function applyJsSort(products: ReturnType<typeof mapProduct>[], sort: string) {
  if (sort === 'price_asc')  return [...products].sort((a, b) => a.price - b.price)
  if (sort === 'price_desc') return [...products].sort((a, b) => b.price - a.price)
  return products
}

interface SearchParams {
  collection?: string
  type?: string
  cardCategory?: string
  sort?: string
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params        = await searchParams
  const activeType    = params.type ?? null
  const activeSort    = params.sort ?? 'newest'
  const activeCollection = params.collection ?? null
  const activeCardCategory = params.cardCategory ?? null

  const supabase = await createClient()

  // Load collections for filtering
  const { data: dbCollections } = await supabase
    .from('collections')
    .select('slug, name, tags, title_uppercase')
    .eq('hidden', false)
    .order('sort_order', { ascending: true })
  const collectionTagMap = Object.fromEntries(
    (dbCollections ?? []).map(c => [c.slug, c.tags as string[]])
  )
  const collectionMetaMap = Object.fromEntries(
    (dbCollections ?? []).map(c => [c.slug, { name: c.name as string, title_uppercase: c.title_uppercase as boolean }])
  )

  // ── SECTIONS VIEW (no type filter) ──────────────────────────────────────────
  if (!activeType && !activeCollection) {
    const sectionResults = await Promise.all(
      typeSections.map(async (section) => {
        let q = supabase
          .from('products')
          .select(PRODUCT_SELECT)
          .eq('hidden', false)
          .overlaps('tags', section.tags)
          .order('created_at', { ascending: false })
          .limit(4)
        const { data } = await q
        return { ...section, products: (data ?? []).map(mapProduct) }
      })
    )

    return (
      <>
        <Nav />
        <main style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400, margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>
              Shop All
            </h1>
            <p style={{ opacity: 0.4, fontSize: '0.875rem', margin: 0 }}>
              Stickers, prints, cards &amp; more
            </p>
          </div>

          <ShopControls activeType={null} activeSort={activeSort} activeCollection={null} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
            {sectionResults.map((section) => (
              <section key={section.slug}>
                {/* Section header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontStyle: 'italic', fontWeight: 400, margin: 0, whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>
                    {section.label}
                  </h2>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <Link
                    href={`/shop?type=${section.slug}`}
                    style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--foreground)', textDecoration: 'none', opacity: 0.35, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.07em' }}
                    className="hover:opacity-100 transition-opacity"
                  >
                    View all →
                  </Link>
                </div>

                {/* 4-up grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                  {section.products.map((p, i) => (
                    <ProductCard key={p.id} {...p} priority={i < 4} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </main>
      </>
    )
  }

  // ── FILTERED VIEW (type or collection selected) ──────────────────────────────
  let dbQuery = supabase
    .from('products')
    .select(PRODUCT_SELECT, { count: 'exact' })
    .eq('hidden', false)

  if (activeSort === 'name_asc')  dbQuery = dbQuery.order('title', { ascending: true })
  else if (activeSort === 'name_desc') dbQuery = dbQuery.order('title', { ascending: false })
  else dbQuery = dbQuery.order('created_at', { ascending: false })

  if (activeCollection && collectionTagMap[activeCollection]) {
    dbQuery = dbQuery.overlaps('tags', collectionTagMap[activeCollection])
  }
  if (activeType && typeTagMap[activeType]) {
    dbQuery = dbQuery.overlaps('tags', typeTagMap[activeType])
  }
  if (activeType === 'cards' && activeCardCategory) {
    dbQuery = dbQuery.contains('tags', [activeCardCategory])
  }

  dbQuery = dbQuery.range(0, PAGE_SIZE - 1)
  const { data: products, count } = await dbQuery

  let displayProducts = (products ?? []).map(mapProduct)
  if (activeSort === 'price_asc' || activeSort === 'price_desc') {
    displayProducts = applyJsSort(displayProducts, activeSort)
  }

  const totalCount = count ?? 0
  const showCardSidebar = activeType === 'cards'

  const activeCollectionMeta = activeCollection ? collectionMetaMap[activeCollection] : null
  const typeTitleMap: Record<string, string> = {
    stickers: 'Stickers', 'sticker-packs': 'Sticker Packs',
    prints: 'Prints', 'mini-prints': 'Mini Prints', cards: 'Greeting Cards',
  }
  const pageTitle = activeCollection
    ? (activeCollectionMeta?.name ?? activeCollection)
    : activeType ? (typeTitleMap[activeType] ?? activeType)
    : 'All Products'
  const pageTitleUppercase = activeCollectionMeta?.title_uppercase ?? false
  const activeCardCategoryLabel = cardCategories.find(c => c.slug === activeCardCategory)?.label

  return (
    <>
      <Nav />
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 400,
            margin: 0,
            letterSpacing: pageTitleUppercase ? '0.06em' : '-0.02em',
            textTransform: pageTitleUppercase ? 'uppercase' : 'none',
          }}>
            {activeCardCategoryLabel && activeCardCategoryLabel !== 'All Cards'
              ? `${activeCardCategoryLabel} Cards`
              : pageTitle}
          </h1>
          {activeType === 'mini-prints' ? (
            <p style={{ fontSize: '0.875rem', margin: '0.5rem 0 0' }}>
              <span style={{ opacity: 0.4 }}>{totalCount} product{totalCount !== 1 ? 's' : ''}</span>
            </p>
          ) : (
            <p style={{ opacity: 0.5, fontSize: '0.875rem', margin: '0.5rem 0 0' }}>
              {totalCount} product{totalCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <ShopControls activeType={activeType} activeSort={activeSort} activeCollection={activeCollection} />

        {/* Deal banners */}
        {activeType === 'stickers' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '2rem', background: 'var(--muted)', borderRadius: '1rem', padding: '1.5rem 2rem', marginBottom: '2.5rem', borderLeft: '3px solid var(--accent)' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 0.3rem', lineHeight: 1.2 }}>
                Buy any 3 stickers, get one free
              </p>
              <p style={{ fontSize: '0.825rem', opacity: 0.5, margin: 0, lineHeight: 1.5 }}>
                Mix and match freely. Discount applied automatically at checkout.
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 400, color: 'var(--accent)', margin: 0, letterSpacing: '-0.03em', lineHeight: 1, filter: 'brightness(0.78)' }}>
                1 free
              </p>
              <p style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.4, margin: '0.2rem 0 0', fontWeight: 600 }}>
                with any 3
              </p>
            </div>
          </div>
        )}

        {activeType === 'mini-prints' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '2rem', background: 'var(--muted)', borderRadius: '1rem', padding: '1.5rem 2rem', marginBottom: '2.5rem', borderLeft: '3px solid var(--accent)' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 0.3rem', lineHeight: 1.2 }}>
                Mix &amp; match any 4 mini prints
              </p>
              <p style={{ fontSize: '0.825rem', opacity: 0.5, margin: 0, lineHeight: 1.5 }}>
                Discount applied automatically at checkout, no code needed.
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 400, color: 'var(--accent)', margin: 0, letterSpacing: '-0.03em', lineHeight: 1, filter: 'brightness(0.78)' }}>
                $16
              </p>
              <p style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.4, margin: '0.2rem 0 0', fontWeight: 600 }}>
                for any 4
              </p>
            </div>
          </div>
        )}

        {/* Content — sidebar + grid */}
        <div className={showCardSidebar ? 'shop-grid-with-sidebar' : undefined} style={{
          display: 'grid',
          gridTemplateColumns: showCardSidebar ? '168px 1fr' : '1fr',
          gap: showCardSidebar ? '3rem' : 0,
          alignItems: 'start',
        }}>
          <style>{`
            @media (max-width: 767px) {
              .shop-grid-with-sidebar { grid-template-columns: 1fr !important; }
              .shop-grid-with-sidebar .card-category-sidebar { display: none; }
            }
          `}</style>

          {showCardSidebar && (
            <nav className="card-category-sidebar" aria-label="Card categories" style={{ position: 'sticky', top: '5rem' }}>
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

          {totalCount === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', opacity: 0.4 }}>
              <p>No products found.</p>
            </div>
          ) : (
            <ProductGrid
              key={`${activeCollection}-${activeType}-${activeCardCategory}-${activeSort}`}
              initialProducts={displayProducts}
              totalCount={totalCount}
              filterParams={{
                collectionTags: activeCollection ? collectionTagMap[activeCollection] : undefined,
                typeTags: activeType ? typeTagMap[activeType] : undefined,
                cardCategory: activeCardCategory ?? undefined,
                sort: activeSort,
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
