'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import dynamic from 'next/dynamic'
import TagInput from '@/components/admin/TagInput'
import AutocompleteInput from '@/components/admin/AutocompleteInput'
import ImageUploader from '@/components/admin/ImageUploader'
import { updateProduct, upsertVariants, deleteVariant } from '../actions'
import { stripHtml } from '@/lib/formatting'

// Tiptap is client-only, load dynamically to avoid SSR issues
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
  wholesale_price?: number | null
  retail_price?: number | null
  sku?: string
  inventory_quantity?: number
  inventory_policy?: string
  image_id?: string | null
}

function isSimpleVariant(v: Variant) {
  return !v.option2_name && (!v.option1_name || v.option1_name === 'Title')
}

type Image = {
  id: string
  url: string
  position: number
  alt_text?: string | null
  synced_to_faire?: boolean
  faire_image_id?: string | null
}

type Product = {
  id: string
  title: string
  handle: string
  description?: string | null
  product_type?: string | null
  tags?: string[]
  hidden: boolean
  seo_title?: string | null
  seo_description?: string | null
}

function plainLength(html: string) {
  return stripHtml(html).length
}


export default function ProductForm({
  product,
  variants = [],
  images = [],
  allTags = [],
  allTypes = [],
}: {
  product: Product
  variants?: Variant[]
  images?: Image[]
  allTags?: string[]
  allTypes?: string[]
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Product fields
  const [title, setTitle] = useState(product?.title ?? '')
  const [handle, setHandle] = useState(product?.handle ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [productType, setProductType] = useState(product?.product_type ?? '')
  const [tags, setTags] = useState<string[]>(product?.tags ?? [])
  const [hidden, setHidden] = useState(product?.hidden ?? false)
  const [seoTitle, setSeoTitle] = useState(product?.seo_title ?? '')
  const [seoDescription, setSeoDescription] = useState(product?.seo_description ?? '')

  // Variants state
  const [variantRows, setVariantRows] = useState<Variant[]>(
    variants.length > 0
      ? variants
      : [{ option1_name: 'Title', option1_value: 'Default Title', price: 0, inventory_quantity: 0, inventory_policy: 'deny' }]
  )

  // Track whether the handle has been manually edited so we stop auto-generating
  const handleManuallyEdited = useRef(!!product?.handle)

  // Images state (managed by ImageUploader)
  const [imageList, setImageList] = useState<Image[]>(images)

  // Sync imageList when server refreshes (e.g. after Faire sync updates synced_to_faire)
  // Use a stable key instead of the array reference to avoid infinite re-renders
  const imagesKey = images.map(i => `${i.id}:${i.synced_to_faire}`).join(',')
  useEffect(() => {
    setImageList(images)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagesKey])

  function slugify(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
  }

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!handleManuallyEdited.current) {
      setHandle(slugify(value))
    }
  }

  function handleHandleChange(value: string) {
    handleManuallyEdited.current = true
    setHandle(value)
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
    if (row.id) {
      startTransition(async () => {
        await deleteVariant(row.id!, product.id)
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
      hidden,
      seo_title: seoTitle || undefined,
      seo_description: seoDescription || undefined,
    }

    startTransition(async () => {
      try {
        await updateProduct(product.id, productData)
        await upsertVariants(product.id, variantRows)
        setSuccess(true)
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
              onChange={e => handleHandleChange(e.target.value)}
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
            {(() => {
              const len = plainLength(description)
              const ok = len >= 50
              return (
                <span style={{ fontSize: '0.75rem', color: ok ? '#166534' : '#92400e', opacity: 0.8 }}>
                  {len} chars{!ok && ` — minimum 50 for Faire`}
                </span>
              )
            })()}
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
              checked={hidden}
              onChange={e => setHidden(e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Hidden from storefront</span>
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

      {/* Pricing & Inventory */}
      <section style={sectionStyle}>
        {variantRows.length === 1 && isSimpleVariant(variantRows[0]) ? (
          // ── Simple product: clean pricing card ──
          <>
            <SectionTitle>Pricing &amp; Inventory</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Price row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <label style={labelStyle}>
                  <span style={labelTextStyle}>Store price</span>
                  <div style={priceInputWrapper}>
                    <span style={currencySymbol}>$</span>
                    <input
                      type="number"
                      value={variantRows[0].price}
                      onChange={e => updateVariant(0, 'price', parseFloat(e.target.value) || 0)}
                      style={priceInput}
                      step="0.01" min="0" placeholder="0.00"
                    />
                  </div>
                </label>
                <label style={labelStyle}>
                  <span style={labelTextStyle}>Wholesale <span style={{ opacity: 0.5, fontWeight: 400 }}>(Faire)</span></span>
                  <div style={priceInputWrapper}>
                    <span style={currencySymbol}>$</span>
                    <input
                      type="number"
                      value={variantRows[0].wholesale_price ?? ''}
                      onChange={e => updateVariant(0, 'wholesale_price', e.target.value ? parseFloat(e.target.value) : null)}
                      style={priceInput}
                      step="0.01" min="0" placeholder="0.00"
                    />
                  </div>
                </label>
                <label style={labelStyle}>
                  <span style={labelTextStyle}>Retail / MSRP <span style={{ opacity: 0.5, fontWeight: 400 }}>(Faire)</span></span>
                  <div style={priceInputWrapper}>
                    <span style={currencySymbol}>$</span>
                    <input
                      type="number"
                      value={variantRows[0].retail_price ?? ''}
                      onChange={e => updateVariant(0, 'retail_price', e.target.value ? parseFloat(e.target.value) : null)}
                      style={priceInput}
                      step="0.01" min="0" placeholder="0.00"
                    />
                  </div>
                </label>
              </div>

              {/* Inventory row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <label style={labelStyle}>
                  <span style={labelTextStyle}>SKU</span>
                  <input
                    type="text"
                    value={variantRows[0].sku ?? ''}
                    onChange={e => updateVariant(0, 'sku', e.target.value)}
                    style={inputStyle}
                    placeholder="Optional"
                  />
                </label>
                <label style={labelStyle}>
                  <span style={labelTextStyle}>Inventory</span>
                  <input
                    type="number"
                    value={variantRows[0].inventory_quantity ?? 0}
                    onChange={e => updateVariant(0, 'inventory_quantity', parseInt(e.target.value) || 0)}
                    style={inputStyle}
                    min="0"
                  />
                </label>
                <label style={labelStyle}>
                  <span style={labelTextStyle}>If sold out</span>
                  <select
                    value={variantRows[0].inventory_policy ?? 'deny'}
                    onChange={e => updateVariant(0, 'inventory_policy', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="deny">Stop selling</option>
                    <option value="continue">Allow backorder</option>
                  </select>
                </label>
              </div>

              <button
                type="button"
                onClick={addVariantRow}
                style={{
                  alignSelf: 'flex-start',
                  background: 'none',
                  border: '1px dashed var(--border)',
                  borderRadius: '0.5rem',
                  padding: '0.4rem 0.875rem',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  color: 'var(--foreground)',
                  opacity: 0.5,
                  fontFamily: 'inherit',
                }}
                className="hover:opacity-100"
              >
                + Add variants (size, color…)
              </button>
            </div>
          </>
        ) : (
          // ── Multi-variant: table ──
          <>
            <SectionTitle>Variants</SectionTitle>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Option', 'Value', 'Price', 'Wholesale', 'Retail', 'SKU', 'Qty', 'If sold out', ''].map((h, i) => (
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
                        <input type="text" value={v.option1_name ?? ''} onChange={e => updateVariant(i, 'option1_name', e.target.value)} style={smallInputStyle} placeholder="Size" />
                      </td>
                      <td style={{ padding: '0.4rem 0.25rem' }}>
                        <input type="text" value={v.option1_value ?? ''} onChange={e => updateVariant(i, 'option1_value', e.target.value)} style={smallInputStyle} placeholder="8×10" />
                      </td>
                      <td style={{ padding: '0.4rem 0.25rem' }}>
                        <input type="number" value={v.price} onChange={e => updateVariant(i, 'price', parseFloat(e.target.value) || 0)} style={{ ...smallInputStyle, width: 68 }} step="0.01" min="0" />
                      </td>
                      <td style={{ padding: '0.4rem 0.25rem' }}>
                        <input type="number" value={v.wholesale_price ?? ''} onChange={e => updateVariant(i, 'wholesale_price', e.target.value ? parseFloat(e.target.value) : null)} style={{ ...smallInputStyle, width: 68 }} step="0.01" min="0" placeholder="—" />
                      </td>
                      <td style={{ padding: '0.4rem 0.25rem' }}>
                        <input type="number" value={v.retail_price ?? ''} onChange={e => updateVariant(i, 'retail_price', e.target.value ? parseFloat(e.target.value) : null)} style={{ ...smallInputStyle, width: 68 }} step="0.01" min="0" placeholder="—" />
                      </td>
                      <td style={{ padding: '0.4rem 0.25rem' }}>
                        <input type="text" value={v.sku ?? ''} onChange={e => updateVariant(i, 'sku', e.target.value)} style={{ ...smallInputStyle, width: 88 }} placeholder="SKU" />
                      </td>
                      <td style={{ padding: '0.4rem 0.25rem' }}>
                        <input type="number" value={v.inventory_quantity ?? 0} onChange={e => updateVariant(i, 'inventory_quantity', parseInt(e.target.value) || 0)} style={{ ...smallInputStyle, width: 52 }} min="0" />
                      </td>
                      <td style={{ padding: '0.4rem 0.25rem' }}>
                        <select value={v.inventory_policy ?? 'deny'} onChange={e => updateVariant(i, 'inventory_policy', e.target.value)} style={{ ...smallInputStyle, width: 80 }}>
                          <option value="deny">Stop selling</option>
                          <option value="continue">Allow backorder</option>
                        </select>
                      </td>
                      <td style={{ padding: '0.4rem 0.25rem' }}>
                        <button type="button" onClick={() => removeVariant(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4, fontSize: '1rem', padding: '0 0.25rem', color: 'var(--foreground)' }} className="hover:opacity-100" title="Remove">×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={addVariantRow}
              style={{ marginTop: '0.75rem', background: 'none', border: '1px dashed var(--border)', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--foreground)', opacity: 0.6, fontFamily: 'inherit' }}
              className="hover:opacity-100"
            >
              + Add variant
            </button>
          {/* Variant photo assignment */}
          {(() => {
            const realVariants = variantRows.filter(v => v.option1_name && v.option1_name !== 'Title')
            if (realVariants.length === 0 || imageList.length === 0) return null
            return (
              <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.4, margin: '0 0 0.75rem' }}>
                  Variant Photos
                </p>
                <p style={{ fontSize: '0.8rem', opacity: 0.5, margin: '0 0 1rem', lineHeight: 1.5 }}>
                  Click a photo to link it to a variant. Clicking again removes the link. Saved with the form.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {variantRows.map((v, i) => {
                    if (!v.option1_name || v.option1_name === 'Title') return null
                    const label = [v.option1_value, v.option2_value].filter(Boolean).join(' / ') || 'Variant'
                    return (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontSize: '0.82rem', fontWeight: 500, margin: 0 }}>{label}</p>
                          <p style={{ fontSize: '0.72rem', opacity: 0.35, margin: '0.2rem 0 0' }}>
                            {v.image_id ? 'Photo linked' : 'No photo'}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                          {imageList.map(img => {
                            const isSelected = v.image_id === img.id
                            return (
                              <button
                                key={img.id}
                                type="button"
                                onClick={() => updateVariant(i, 'image_id', isSelected ? null : img.id)}
                                title={img.alt_text ?? `Photo ${img.position}`}
                                style={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: '0.4rem',
                                  overflow: 'hidden',
                                  border: isSelected ? '2.5px solid var(--accent)' : '2px solid var(--border)',
                                  padding: 0,
                                  cursor: 'pointer',
                                  flexShrink: 0,
                                  background: 'var(--background)',
                                  outline: isSelected ? '1px solid var(--accent)' : 'none',
                                  transition: 'border-color 0.15s, outline 0.15s',
                                }}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}
          </>
        )}
      </section>

      {/* Images (edit mode only) */}
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
          {isPending ? 'Saving…' : 'Save changes'}
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

const priceInputWrapper: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  border: '1px solid var(--border)',
  borderRadius: '0.5rem',
  background: 'var(--background)',
  overflow: 'hidden',
}

const currencySymbol: React.CSSProperties = {
  padding: '0 0.625rem',
  fontSize: '0.875rem',
  color: 'var(--foreground)',
  opacity: 0.4,
  userSelect: 'none',
  borderRight: '1px solid var(--border)',
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
  alignSelf: 'stretch',
}

const priceInput: React.CSSProperties = {
  flex: 1,
  padding: '0.6rem 0.75rem',
  border: 'none',
  background: 'transparent',
  fontSize: '0.875rem',
  color: 'var(--foreground)',
  fontFamily: 'inherit',
  width: '100%',
  outline: 'none',
}
