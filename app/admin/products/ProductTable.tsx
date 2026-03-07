'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toggleHidden, deleteProducts, duplicateProduct } from '../actions'

type Product = {
  id: string
  title: string
  product_type: string | null
  tags: string[] | null
  hidden: boolean
  faire_product_id: string | null
  product_variants: { price: number }[]
  product_images: { url: string; position: number; synced_to_faire: boolean }[]
}

export default function ProductTable({ products }: { products: Product[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  function toggleRow(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === products.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(products.map(p => p.id)))
    }
  }

  function handleBulkDelete() {
    startTransition(async () => {
      await deleteProducts(Array.from(selected))
      setSelected(new Set())
      setConfirming(false)
      router.refresh()
    })
  }

  const allChecked = products.length > 0 && selected.size === products.length
  const someChecked = selected.size > 0

  return (
    <>
      {someChecked && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.6rem 0.875rem',
          marginBottom: '0.5rem',
          background: 'var(--muted)',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
        }}>
          <span style={{ opacity: 0.6 }}>{selected.size} selected</span>
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              style={{
                fontSize: '0.8rem',
                padding: '0.3rem 0.75rem',
                border: '1px solid #fca5a5',
                borderRadius: 4,
                background: 'transparent',
                cursor: 'pointer',
                color: '#dc2626',
                fontFamily: 'inherit',
              }}
            >
              Delete selected
            </button>
          ) : (
            <>
              <span style={{ opacity: 0.7 }}>Delete {selected.size} product{selected.size !== 1 ? 's' : ''}?</span>
              <button
                onClick={handleBulkDelete}
                disabled={isPending}
                style={{
                  fontSize: '0.8rem',
                  padding: '0.3rem 0.75rem',
                  border: 'none',
                  borderRadius: 4,
                  background: '#dc2626',
                  color: '#fff',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  opacity: isPending ? 0.6 : 1,
                }}
              >
                {isPending ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                onClick={() => setConfirming(false)}
                style={{
                  fontSize: '0.8rem',
                  padding: '0.3rem 0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  color: 'var(--foreground)',
                }}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '0.625rem 0.875rem', width: 32 }}>
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              {['', 'Title', 'Type', 'Tags', 'Price', 'Hidden', 'Faire', ''].map((h, i) => (
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
              const imgs = product.product_images ?? []
              const thumb = [...imgs].sort((a, b) => a.position - b.position)[0]?.url
              const variantPrices = product.product_variants.map(v => Number(v.price))
              const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : null
              const faireLinked = !!product.faire_product_id
              const unsyncedCount = imgs.filter(i => !i.synced_to_faire).length
              const isSelected = selected.has(product.id)

              return (
                <tr
                  key={product.id}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: isSelected ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : undefined,
                  }}
                  className="hover:bg-[var(--muted)] transition-colors"
                >
                  <td style={{ padding: '0.75rem 0.875rem' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRow(product.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
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
                    <button
                      type="button"
                      onClick={() => startTransition(async () => {
                        await toggleHidden(product.id, !product.hidden)
                        router.refresh()
                      })}
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '0.2rem 0.65rem',
                        borderRadius: '100px',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        background: product.hidden ? '#fef9c3' : 'var(--border)',
                        color: product.hidden ? '#854d0e' : 'var(--foreground)',
                        opacity: product.hidden ? 1 : 0.35,
                      }}
                    >
                      {product.hidden ? 'Hidden' : 'Visible'}
                    </button>
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
                  <td style={{ padding: '0.75rem 0.875rem', whiteSpace: 'nowrap', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => startTransition(async () => {
                        const newId = await duplicateProduct(product.id)
                        router.push(`/admin/products/${newId}`)
                      })}
                      style={{ fontSize: '0.8rem', opacity: 0.4, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', color: 'inherit' }}
                      className="hover:opacity-100"
                    >
                      Dupe
                    </button>
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
    </>
  )
}
