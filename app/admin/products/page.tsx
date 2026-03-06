import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { togglePublished, getAllTypes, getAllTags } from '../actions'
import ProductFilters from './ProductFilters'
import BulkFaireSyncButton from './BulkFaireSyncButton'
import ProductSearch from './ProductSearch'
import Pagination from './Pagination'

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
          <BulkFaireSyncButton
            count={sorted.filter(p =>
              p.faire_product_id &&
              (p.product_images as { synced_to_faire: boolean }[]).some(i => !i.synced_to_faire)
            ).length}
          />
          <Link
            href="/admin/products/new"
            style={{
              background: 'var(--foreground)',
              color: 'var(--background)',
              padding: '0.55rem 1.25rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            + New product
          </Link>
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
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['', 'Title', 'Type', 'Tags', 'Price', 'Published', 'Faire', ''].map((h, i) => (
                  <th
                    key={i}
                    style={{
                      padding: '0.625rem 0.875rem',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      opacity: 0.5,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((product) => {
                const imgs = (product.product_images as { url: string; position: number; synced_to_faire: boolean }[]) ?? []
                const thumb = [...imgs].sort((a, b) => a.position - b.position)[0]?.url
                const variantPrices = (product.product_variants as { price: number }[]).map(v => Number(v.price))
                const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : null
                const faireLinked = !!product.faire_product_id
                const unsyncedCount = imgs.filter(i => !i.synced_to_faire).length

                return (
                  <tr
                    key={product.id}
                    style={{ borderBottom: '1px solid var(--border)' }}
                    className="hover:bg-[var(--muted)] transition-colors"
                  >
                    <td style={{ padding: '0.75rem 0.875rem', width: 52 }}>
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt=""
                          loading="lazy"
                          style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '0.375rem', background: 'var(--border)', display: 'block' }}
                        />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: '0.375rem', background: 'var(--border)' }} />
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 0.875rem' }}>
                      <Link
                        href={`/admin/products/${product.id}`}
                        style={{ textDecoration: 'none', color: 'inherit', fontWeight: 500 }}
                        className="hover:underline"
                      >
                        {product.title}
                      </Link>
                    </td>
                    <td style={{ padding: '0.75rem 0.875rem', opacity: 0.55 }}>
                      {product.product_type ?? ''}
                    </td>
                    <td style={{ padding: '0.75rem 0.875rem', maxWidth: 200 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {(product.tags ?? []).slice(0, 4).map((tag: string) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.1rem 0.5rem',
                              borderRadius: '100px',
                              background: 'var(--border)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                        {(product.tags ?? []).length > 4 && (
                          <span style={{ fontSize: '0.7rem', opacity: 0.4 }}>
                            +{(product.tags ?? []).length - 4}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 0.875rem', opacity: 0.7 }}>
                      {minPrice != null ? `$${minPrice.toFixed(2)}` : ''}
                    </td>
                    <td style={{ padding: '0.75rem 0.875rem' }}>
                      <form
                        action={async () => {
                          'use server'
                          await togglePublished(product.id, !product.published)
                        }}
                      >
                        <button
                          type="submit"
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.65rem',
                            borderRadius: '100px',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            background: product.published ? '#dcfce7' : 'var(--border)',
                            color: product.published ? '#166534' : 'var(--foreground)',
                          }}
                        >
                          {product.published ? 'Published' : 'Draft'}
                        </button>
                      </form>
                    </td>
                    <td style={{ padding: '0.75rem 0.875rem', whiteSpace: 'nowrap' }}>
                      {faireLinked ? (
                        unsyncedCount === 0 ? (
                          <span style={{ fontSize: '0.72rem', color: '#166534', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span style={{ fontSize: '0.5rem' }}>●</span> synced
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#92400e', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span style={{ fontSize: '0.5rem' }}>●</span> {unsyncedCount} unsynced
                          </span>
                        )
                      ) : (
                        <span style={{ fontSize: '0.75rem', opacity: 0.2 }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 0.875rem' }}>
                      <Link
                        href={`/admin/products/${product.id}`}
                        style={{ fontSize: '0.8rem', opacity: 0.5, textDecoration: 'none', color: 'inherit' }}
                        className="hover:opacity-100"
                      >
                        Edit →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} filterParams={filterParams} />
      )}
    </div>
  )
}
