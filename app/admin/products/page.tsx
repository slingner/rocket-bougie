import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { togglePublished } from '../actions'
import ProductFilters from './ProductFilters'

export const metadata = { title: 'Products — Admin' }

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; tag?: string; published?: string; sort?: string }>
}) {
  const params = await searchParams
  const supabase = await createAdminClient()

  // Fetch all products with variants + images
  let query = supabase
    .from('products')
    .select(`
      id, title, product_type, published, handle, tags,
      product_variants ( price ),
      product_images ( url, position )
    `)

  // Filter by published
  if (params.published === 'yes') query = query.eq('published', true)
  else if (params.published === 'no') query = query.eq('published', false)

  // Filter by type
  if (params.type) query = query.eq('product_type', params.type)

  // Filter by tag
  if (params.tag) query = query.contains('tags', [params.tag])

  // Default sort
  query = query.order('title', { ascending: true })

  const { data: products } = await query

  // Sort by price client-side (since price lives on variants)
  let sorted = [...(products ?? [])]
  if (params.sort === 'price-asc' || params.sort === 'price-desc') {
    sorted.sort((a, b) => {
      const ap = Math.min(...(a.product_variants as { price: number }[]).map(v => Number(v.price)), Infinity)
      const bp = Math.min(...(b.product_variants as { price: number }[]).map(v => Number(v.price)), Infinity)
      return params.sort === 'price-asc' ? ap - bp : bp - ap
    })
  }

  // Collect filter options
  const allTypes = Array.from(
    new Set((products ?? []).map(p => p.product_type).filter(Boolean) as string[])
  ).sort()

  const allTags = Array.from(
    new Set((products ?? []).flatMap(p => p.tags ?? []))
  ).sort()

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
            ({sorted.length})
          </span>
        </h1>
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

      {/* Filters */}
      <ProductFilters
        allTypes={allTypes}
        allTags={allTags}
        currentType={params.type}
        currentTag={params.tag}
        currentPublished={params.published}
        currentSort={params.sort}
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
                {['', 'Title', 'Type', 'Tags', 'Price', 'Published', ''].map((h, i) => (
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
                const imgs = (product.product_images as { url: string; position: number }[]) ?? []
                const thumb = [...imgs].sort((a, b) => a.position - b.position)[0]?.url
                const variantPrices = (product.product_variants as { price: number }[]).map(v => Number(v.price))
                const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : null

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
                      {product.product_type ?? '—'}
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
                      {minPrice != null ? `$${minPrice.toFixed(2)}` : '—'}
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
      )}
    </div>
  )
}
