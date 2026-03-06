import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { getAllTypes, getAllTags, createBlankProduct } from '../actions'
import ProductFilters from './ProductFilters'
import FaireSyncQueue from './FaireSyncQueue'
import ProductSearch from './ProductSearch'
import Pagination from './Pagination'
import ProductTable from './ProductTable'

const PAGE_SIZE = 25

export const metadata = { title: 'Products | Admin' }

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; tag?: string; published?: string; sort?: string; search?: string; page?: string }>
}) {
  const params = await searchParams
  const supabase = await createAdminClient()

  const page = Math.max(1, Number(params.page ?? 1))
  const isPriceSort = params.sort === 'price-asc' || params.sort === 'price-desc'

  // Build base query with all filters
  let query = supabase
    .from('products')
    .select(`
      id, title, product_type, published, handle, tags, faire_product_id,
      product_variants ( price ),
      product_images ( url, position, synced_to_faire )
    `, { count: 'exact' })

  if (params.published === 'yes') query = query.eq('published', true)
  else if (params.published === 'no') query = query.eq('published', false)
  if (params.type) query = query.eq('product_type', params.type)
  if (params.tag) query = query.contains('tags', [params.tag])
  if (params.search) query = query.ilike('title', `%${params.search}%`)

  query = query.order('title', { ascending: true })

  // Price sort: fetch all and sort client-side (price lives on variants, not products)
  // Other sorts: paginate in DB
  let products: Awaited<ReturnType<typeof query>>['data']
  let count: number | null

  if (isPriceSort) {
    const result = await query
    products = result.data
    count = result.count
  } else {
    const offset = (page - 1) * PAGE_SIZE
    const result = await query.range(offset, offset + PAGE_SIZE - 1)
    products = result.data
    count = result.count
  }

  // Sort by price client-side (since price lives on variants)
  let sorted = [...(products ?? [])]
  if (isPriceSort) {
    sorted.sort((a, b) => {
      const ap = Math.min(...(a.product_variants as { price: number }[]).map(v => Number(v.price)), Infinity)
      const bp = Math.min(...(b.product_variants as { price: number }[]).map(v => Number(v.price)), Infinity)
      return params.sort === 'price-asc' ? ap - bp : bp - ap
    })
    // Paginate client-side for price sort
    const offset = (page - 1) * PAGE_SIZE
    sorted = sorted.slice(offset, offset + PAGE_SIZE)
  }

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  // Global Faire sync queue — all products across all pages, not just current
  const { data: unsyncedImgRows } = await supabase
    .from('product_images')
    .select('product_id')
    .eq('synced_to_faire', false)

  const unsyncedByProduct = (unsyncedImgRows ?? []).reduce((acc, img) => {
    acc[img.product_id] = (acc[img.product_id] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const queueProductIds = Object.keys(unsyncedByProduct)

  let syncQueue: { id: string; title: string; unsyncedCount: number }[] = []
  if (queueProductIds.length > 0) {
    const { data: queueProducts } = await supabase
      .from('products')
      .select('id, title')
      .in('id', queueProductIds)
      .not('faire_product_id', 'is', null)
      .order('title')
    syncQueue = (queueProducts ?? []).map(p => ({
      id: p.id,
      title: p.title,
      unsyncedCount: unsyncedByProduct[p.id] ?? 0,
    }))
  }

  // Fetch all types/tags across all products (not just current page) for filter dropdowns
  const [allTypes, allTags] = await Promise.all([getAllTypes(), getAllTags()])

  // filterParams for pagination — everything except page
  const filterParams: Record<string, string> = {}
  if (params.type) filterParams.type = params.type
  if (params.tag) filterParams.tag = params.tag
  if (params.published) filterParams.published = params.published
  if (params.sort) filterParams.sort = params.sort
  if (params.search) filterParams.search = params.search

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.75rem',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          Products
          <span style={{ fontSize: '0.9rem', fontFamily: 'var(--font-sans)', opacity: 0.4, marginLeft: '0.5rem', fontWeight: 400 }}>
            ({count ?? 0})
          </span>
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FaireSyncQueue products={syncQueue} />
          <form action={async () => {
            'use server'
            const id = await createBlankProduct()
            redirect(`/admin/products/${id}`)
          }}>
            <button
              type="submit"
              style={{
                background: 'var(--foreground)',
                color: 'var(--background)',
                padding: '0.55rem 1.25rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              + New product
            </button>
          </form>
        </div>
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <ProductSearch currentSearch={params.search} filterParams={filterParams} />
      </div>
      <ProductFilters
        allTypes={allTypes}
        allTags={allTags}
        currentType={params.type}
        currentTag={params.tag}
        currentPublished={params.published}
        currentSort={params.sort}
        currentSearch={params.search}
      />

      {sorted.length === 0 ? (
        <div
          style={{
            background: 'var(--muted)',
            borderRadius: '0.75rem',
            padding: '3rem',
            textAlign: 'center',
            opacity: 0.6,
          }}
        >
          No products match the current filters.
        </div>
      ) : (
        <>
        <ProductTable products={sorted as any} />
        <Pagination page={page} totalPages={totalPages} filterParams={filterParams} />
        </>
      )}
    </div>
  )
}
