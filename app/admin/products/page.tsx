import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { togglePublished } from '../actions'

export const metadata = { title: 'Products — Admin' }

export default async function ProductsPage() {
  const supabase = await createAdminClient()

  const { data: products } = await supabase
    .from('products')
    .select(`
      id, title, product_type, published, handle,
      product_variants ( price ),
      product_images ( url, position )
    `)
    .order('title', { ascending: true })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
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

      {!products || products.length === 0 ? (
        <div
          style={{
            background: 'var(--muted)',
            borderRadius: '0.75rem',
            padding: '3rem',
            textAlign: 'center',
            opacity: 0.6,
          }}
        >
          No products yet.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['', 'Title', 'Type', 'Price', 'Published', ''].map((h, i) => (
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
              {products.map((product) => {
                const images = (product.product_images as { url: string; position: number }[]) ?? []
                const sorted = [...images].sort((a, b) => a.position - b.position)
                const thumb = sorted[0]?.url
                const variants = (product.product_variants as { price: number }[]) ?? []
                const prices = variants.map(v => Number(v.price))
                const minPrice = prices.length > 0 ? Math.min(...prices) : null

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
