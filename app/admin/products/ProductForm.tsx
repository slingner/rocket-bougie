'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateProduct, createProduct, upsertVariants, deleteVariant, deleteImage, addProductImage } from '../actions'

type Variant = {
  id?: string
  option1_name?: string
  option1_value?: string
  option2_name?: string
  option2_value?: string
  price: number
  compare_at_price?: number | null
  sku?: string
  inventory_quantity?: number
  inventory_policy?: string
}

type Image = {
  id: string
  url: string
  position: number
  alt_text?: string | null
}

type Product = {
  id: string
  title: string
  handle: string
  description?: string | null
  product_type?: string | null
  tags?: string[]
  published: boolean
  seo_title?: string | null
  seo_description?: string | null
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function ProductForm({
  product,
  variants = [],
  images = [],
  mode,
}: {
  product?: Product
  variants?: Variant[]
  images?: Image[]
  mode: 'edit' | 'new'
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Product fields
  const [title, setTitle] = useState(product?.title ?? '')
  const [handle, setHandle] = useState(product?.handle ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [productType, setProductType] = useState(product?.product_type ?? '')
  const [tags, setTags] = useState((product?.tags ?? []).join(', '))
  const [published, setPublished] = useState(product?.published ?? true)
  const [seoTitle, setSeoTitle] = useState(product?.seo_title ?? '')
  const [seoDescription, setSeoDescription] = useState(product?.seo_description ?? '')

  // Variants state
  const [variantRows, setVariantRows] = useState<Variant[]>(
    variants.length > 0
      ? variants
      : [{ option1_name: 'Title', option1_value: 'Default Title', price: 0, inventory_quantity: 0, inventory_policy: 'deny' }]
  )

  // Images state
  const [imageRows, setImageRows] = useState<Image[]>(images)
  const [imageUrl, setImageUrl] = useState('')

  function handleTitleChange(value: string) {
    setTitle(value)
    if (mode === 'new') {
      setHandle(slugify(value))
    }
  }

  function updateVariant(index: number, field: keyof Variant, value: string | number | null) {
    setVariantRows(rows => rows.map((r, i) => i === index ? { ...r, [field]: value } : r))
  }

  function addVariantRow() {
    setVariantRows(rows => [
      ...rows,
      { option1_name: '', option1_value: '', price: 0, inventory_quantity: 0, inventory_policy: 'deny' },
    ])
  }

  async function removeVariant(index: number) {
    const row = variantRows[index]
    if (row.id && product?.id) {
      startTransition(async () => {
        await deleteVariant(row.id!, product!.id)
      })
    }
    setVariantRows(rows => rows.filter((_, i) => i !== index))
  }

  async function removeImage(img: Image) {
    if (product?.id) {
      startTransition(async () => {
        await deleteImage(img.id, product!.id)
      })
    }
    setImageRows(rows => rows.filter(r => r.id !== img.id))
  }

  async function addImageFromUrl() {
    if (!imageUrl.trim() || !product?.id) return
    const pos = imageRows.length + 1
    startTransition(async () => {
      await addProductImage(product!.id, imageUrl.trim(), pos)
    })
    setImageRows(rows => [
      ...rows,
      { id: crypto.randomUUID(), url: imageUrl.trim(), position: pos },
    ])
    setImageUrl('')
  }

  async function handleSave() {
    setError(null)
    setSuccess(false)

    const tagsArray = tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

    const productData = {
      title,
      handle,
      description: description || undefined,
      product_type: productType || undefined,
      tags: tagsArray,
      published,
      seo_title: seoTitle || undefined,
      seo_description: seoDescription || undefined,
    }

    startTransition(async () => {
      try {
        if (mode === 'new') {
          const newProduct = await createProduct(productData)
          await upsertVariants(newProduct.id, variantRows)
          router.push(`/admin/products/${newProduct.id}`)
        } else if (product?.id) {
          await updateProduct(product.id, productData)
          await upsertVariants(product.id, variantRows)
          setSuccess(true)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong')
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Core fields */}
      <section style={sectionStyle}>
        <SectionTitle>Details</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label style={labelStyle}>
            <span style={labelTextStyle}>Title</span>
            <input
              type="text"
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              style={inputStyle}
              placeholder="Product title"
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>Handle / slug</span>
            <input
              type="text"
              value={handle}
              onChange={e => setHandle(e.target.value)}
              style={inputStyle}
              placeholder="product-handle"
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>Description (HTML)</span>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ ...inputStyle, minHeight: 160, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.8rem' }}
              placeholder="<p>Product description…</p>"
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label style={labelStyle}>
              <span style={labelTextStyle}>Product type</span>
              <input
                type="text"
                value={productType}
                onChange={e => setProductType(e.target.value)}
                style={inputStyle}
                placeholder="e.g. Stickers"
              />
            </label>

            <label style={labelStyle}>
              <span style={labelTextStyle}>Tags (comma-separated)</span>
              <input
                type="text"
                value={tags}
                onChange={e => setTags(e.target.value)}
                style={inputStyle}
                placeholder="California, ocean, sticker"
              />
            </label>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={published}
              onChange={e => setPublished(e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Published</span>
          </label>
        </div>
      </section>

      {/* SEO */}
      <section style={sectionStyle}>
        <SectionTitle>SEO</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label style={labelStyle}>
            <span style={labelTextStyle}>SEO title</span>
            <input
              type="text"
              value={seoTitle}
              onChange={e => setSeoTitle(e.target.value)}
              style={inputStyle}
              placeholder="Leave blank to use product title"
            />
          </label>
          <label style={labelStyle}>
            <span style={labelTextStyle}>SEO description</span>
            <textarea
              value={seoDescription}
              onChange={e => setSeoDescription(e.target.value)}
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              placeholder="Short description for search engines"
            />
          </label>
        </div>
      </section>

      {/* Variants */}
      <section style={sectionStyle}>
        <SectionTitle>Variants</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Option', 'Value', 'Price', 'Compare at', 'SKU', 'Qty', 'Policy', ''].map((h, i) => (
                  <th key={i} style={{ padding: '0.4rem 0.5rem', textAlign: 'left', fontWeight: 600, opacity: 0.45, whiteSpace: 'nowrap', fontSize: '0.72rem' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {variantRows.map((v, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.4rem 0.25rem' }}>
                    <input
                      type="text"
                      value={v.option1_name ?? ''}
                      onChange={e => updateVariant(i, 'option1_name', e.target.value)}
                      style={smallInputStyle}
                      placeholder="Title"
                    />
                  </td>
                  <td style={{ padding: '0.4rem 0.25rem' }}>
                    <input
                      type="text"
                      value={v.option1_value ?? ''}
                      onChange={e => updateVariant(i, 'option1_value', e.target.value)}
                      style={smallInputStyle}
                      placeholder="Default Title"
                    />
                  </td>
                  <td style={{ padding: '0.4rem 0.25rem' }}>
                    <input
                      type="number"
                      value={v.price}
                      onChange={e => updateVariant(i, 'price', parseFloat(e.target.value) || 0)}
                      style={{ ...smallInputStyle, width: 72 }}
                      step="0.01"
                      min="0"
                    />
                  </td>
                  <td style={{ padding: '0.4rem 0.25rem' }}>
                    <input
                      type="number"
                      value={v.compare_at_price ?? ''}
                      onChange={e => updateVariant(i, 'compare_at_price', e.target.value ? parseFloat(e.target.value) : null)}
                      style={{ ...smallInputStyle, width: 72 }}
                      step="0.01"
                      min="0"
                      placeholder="—"
                    />
                  </td>
                  <td style={{ padding: '0.4rem 0.25rem' }}>
                    <input
                      type="text"
                      value={v.sku ?? ''}
                      onChange={e => updateVariant(i, 'sku', e.target.value)}
                      style={{ ...smallInputStyle, width: 96 }}
                      placeholder="SKU"
                    />
                  </td>
                  <td style={{ padding: '0.4rem 0.25rem' }}>
                    <input
                      type="number"
                      value={v.inventory_quantity ?? 0}
                      onChange={e => updateVariant(i, 'inventory_quantity', parseInt(e.target.value) || 0)}
                      style={{ ...smallInputStyle, width: 56 }}
                      min="0"
                    />
                  </td>
                  <td style={{ padding: '0.4rem 0.25rem' }}>
                    <select
                      value={v.inventory_policy ?? 'deny'}
                      onChange={e => updateVariant(i, 'inventory_policy', e.target.value)}
                      style={{ ...smallInputStyle, width: 80 }}
                    >
                      <option value="deny">Deny</option>
                      <option value="continue">Continue</option>
                    </select>
                  </td>
                  <td style={{ padding: '0.4rem 0.25rem' }}>
                    <button
                      type="button"
                      onClick={() => removeVariant(i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4, fontSize: '1rem', padding: '0 0.25rem', color: 'var(--foreground)' }}
                      className="hover:opacity-100"
                      title="Remove variant"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={addVariantRow}
          style={{
            marginTop: '0.75rem',
            background: 'none',
            border: '1px dashed var(--border)',
            borderRadius: '0.5rem',
            padding: '0.5rem 1rem',
            fontSize: '0.8rem',
            cursor: 'pointer',
            color: 'var(--foreground)',
            opacity: 0.6,
            fontFamily: 'inherit',
          }}
          className="hover:opacity-100"
        >
          + Add variant
        </button>
      </section>

      {/* Images */}
      {product?.id && (
        <section style={sectionStyle}>
          <SectionTitle>Images</SectionTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            {imageRows.map((img) => (
              <div key={img.id} style={{ position: 'relative' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.alt_text ?? ''}
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: 'cover',
                    borderRadius: '0.5rem',
                    background: 'var(--border)',
                    display: 'block',
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeImage(img)}
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#991b1b',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                  title="Remove image"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="url"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
              placeholder="Image URL"
            />
            <button
              type="button"
              onClick={addImageFromUrl}
              style={{
                background: 'var(--muted)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                padding: '0.6rem 1rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 500,
                color: 'var(--foreground)',
                whiteSpace: 'nowrap',
              }}
            >
              Add image
            </button>
          </div>
        </section>
      )}

      {/* Save */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          style={{
            background: 'var(--foreground)',
            color: 'var(--background)',
            border: 'none',
            padding: '0.7rem 1.75rem',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: isPending ? 'not-allowed' : 'pointer',
            opacity: isPending ? 0.6 : 1,
            fontFamily: 'inherit',
          }}
        >
          {isPending ? 'Saving…' : mode === 'new' ? 'Create product' : 'Save changes'}
        </button>
        {success && (
          <span style={{ fontSize: '0.875rem', color: '#166534', fontWeight: 500 }}>
            Saved.
          </span>
        )}
        {error && (
          <span style={{ fontSize: '0.875rem', color: '#991b1b' }}>
            {error}
          </span>
        )}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        opacity: 0.4,
        margin: '0 0 1rem',
      }}
    >
      {children}
    </h2>
  )
}

const sectionStyle: React.CSSProperties = {
  background: 'var(--muted)',
  borderRadius: '0.875rem',
  padding: '1.25rem 1.5rem',
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.375rem',
}

const labelTextStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 500,
  opacity: 0.6,
}

const inputStyle: React.CSSProperties = {
  padding: '0.6rem 0.875rem',
  borderRadius: '0.5rem',
  border: '1px solid var(--border)',
  background: 'var(--background)',
  fontSize: '0.875rem',
  color: 'var(--foreground)',
  fontFamily: 'inherit',
  width: '100%',
}

const smallInputStyle: React.CSSProperties = {
  padding: '0.35rem 0.5rem',
  borderRadius: '0.375rem',
  border: '1px solid var(--border)',
  background: 'var(--background)',
  fontSize: '0.8rem',
  color: 'var(--foreground)',
  fontFamily: 'inherit',
  width: '100%',
}
