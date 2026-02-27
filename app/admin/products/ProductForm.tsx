'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import TagInput from '@/components/admin/TagInput'
import AutocompleteInput from '@/components/admin/AutocompleteInput'
import ImageUploader from '@/components/admin/ImageUploader'
import { updateProduct, createProduct, upsertVariants, deleteVariant } from '../actions'

// Tiptap is client-only — load dynamically to avoid SSR issues
const RichTextEditor = dynamic(() => import('@/components/admin/RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div style={{
      minHeight: 180,
      border: '1px solid var(--border)',
      borderRadius: '0.5rem',
      background: 'var(--background)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.8rem',
      opacity: 0.4,
    }}>
      Loading editor…
    </div>
  ),
})

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
  allTags = [],
  allTypes = [],
  mode,
}: {
  product?: Product
  variants?: Variant[]
  images?: Image[]
  allTags?: string[]
  allTypes?: string[]
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
  const [tags, setTags] = useState<string[]>(product?.tags ?? [])
  const [published, setPublished] = useState(product?.published ?? true)
  const [seoTitle, setSeoTitle] = useState(product?.seo_title ?? '')
  const [seoDescription, setSeoDescription] = useState(product?.seo_description ?? '')

  // Variants state
  const [variantRows, setVariantRows] = useState<Variant[]>(
    variants.length > 0
      ? variants
      : [{ option1_name: 'Title', option1_value: 'Default Title', price: 0, inventory_quantity: 0, inventory_policy: 'deny' }]
  )

  // Images state (managed by ImageUploader)
  const [imageList, setImageList] = useState<Image[]>(images)

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

  async function handleSave() {
    setError(null)
    setSuccess(false)

    const productData = {
      title,
      handle,
      description: description || undefined,
      product_type: productType || undefined,
      tags,
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

          <div style={labelStyle}>
            <span style={labelTextStyle}>Description</span>
            <RichTextEditor
              initialContent={description}
              onChange={setDescription}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={labelStyle}>
              <span style={labelTextStyle}>Product type</span>
              <AutocompleteInput
                value={productType}
                onChange={setProductType}
                suggestions={allTypes}
                placeholder="e.g. Sticker"
              />
            </div>

            <div style={labelStyle}>
              <span style={labelTextStyle}>Tags</span>
              <TagInput
                value={tags}
                onChange={setTags}
                allTags={allTags}
              />
            </div>
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
                {['Option', 'Value', 'Price', 'Compare at', 'SKU', 'Qty', 'If sold out', ''].map((h, i) => (
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
                      <option value="deny">Stop selling</option>
                      <option value="continue">Allow backorder</option>
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

      {/* Images — only shown when editing an existing product */}
      {product?.id && (
        <section style={sectionStyle}>
          <SectionTitle>Images</SectionTitle>
          <ImageUploader
            productId={product.id}
            images={imageList}
            onImagesChange={setImageList}
          />
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
