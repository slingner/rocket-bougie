'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import {
  upsertCollection,
  deleteCollection,
  searchProductsWithImages,
  getProductsInCollection,
  updateProduct,
  updateCollectionSortOrders,
} from '../actions'

type ProductImage = { id: string; url: string; position: number }
type Product = { id: string; title: string; handle: string; tags: string[]; product_images: ProductImage[] }
type Collection = { id: string; name: string; slug: string; tags: string[]; thumbnail_url: string | null; sort_order: number; title_uppercase: boolean; hidden: boolean }

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

// ─── Main manager ────────────────────────────────────────────────────────────

export default function CollectionsManager({ collections: initial }: { collections: Collection[] }) {
  const [collections, setCollections] = useState<Collection[]>(initial)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [, startTransition] = useTransition()
  const [dragOver, setDragOver] = useState<number | null>(null)
  const dragIndex = useRef<number | null>(null)

  function onSaved(saved: Collection) {
    setCollections(prev =>
      [...prev.filter(c => c.id !== saved.id), saved].sort((a, b) => a.sort_order - b.sort_order)
    )
    setEditingId(null)
  }

  function onDelete(id: string) {
    if (!confirm('Delete this collection? Products keep their tags.')) return
    startTransition(async () => {
      await deleteCollection(id)
      setCollections(prev => prev.filter(c => c.id !== id))
      if (editingId === id) setEditingId(null)
    })
  }

  function handleDragStart(index: number) {
    dragIndex.current = index
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    setDragOver(index)
  }

  function handleDrop(index: number) {
    const from = dragIndex.current
    if (from === null || from === index) { setDragOver(null); return }
    const reordered = [...collections]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(index, 0, moved)
    const withOrder = reordered.map((c, i) => ({ ...c, sort_order: i + 1 }))
    setCollections(withOrder)
    setDragOver(null)
    dragIndex.current = null
    startTransition(async () => {
      await updateCollectionSortOrders(withOrder.map(c => ({ id: c.id, sort_order: c.sort_order })))
    })
  }

  function handleDragEnd() {
    setDragOver(null)
    dragIndex.current = null
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {collections.map((c, i) => (
        <div
          key={c.id}
          draggable
          onDragStart={() => handleDragStart(i)}
          onDragOver={e => handleDragOver(e, i)}
          onDrop={() => handleDrop(i)}
          onDragEnd={handleDragEnd}
          style={{ opacity: dragOver === i && dragIndex.current !== i ? 0.5 : 1, transition: 'opacity 0.15s' }}
        >
          {/* Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
            background: 'var(--muted)',
            borderRadius: editingId === c.id ? '0.75rem 0.75rem 0 0' : '0.75rem',
            padding: '0.75rem 1rem',
            borderBottom: editingId === c.id ? '1px solid var(--border)' : 'none',
            cursor: 'grab',
          }}>
            {/* Drag handle */}
            <span style={{ opacity: 0.25, fontSize: '0.85rem', lineHeight: 1, flexShrink: 0, cursor: 'grab', userSelect: 'none' }}>⠿</span>
            <Thumb url={c.thumbnail_url} size={44} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <p style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>{c.name}</p>
                {c.hidden && (
                  <span style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.35, padding: '0.1rem 0.4rem', borderRadius: '999px', border: '1px solid currentColor' }}>
                    Hidden
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '0.72rem', opacity: 0.4 }}>
                /{c.slug}{c.tags.length ? ` · ${c.tags.join(', ')}` : ''}
              </p>
            </div>
            <Btn onClick={() => setEditingId(editingId === c.id ? null : c.id)}>
              {editingId === c.id ? 'Close' : 'Edit'}
            </Btn>
            <Btn onClick={() => onDelete(c.id)} danger>Delete</Btn>
          </div>

          {/* Inline editor */}
          {editingId === c.id && (
            <CollectionEditor
              collection={c}
              onSaved={onSaved}
              onCancel={() => setEditingId(null)}
            />
          )}
        </div>
      ))}

      {/* New collection */}
      {editingId === 'new' ? (
        <CollectionEditor
          collection={{ id: '', name: '', slug: '', tags: [], thumbnail_url: null, sort_order: collections.length + 1, title_uppercase: false, hidden: false }}
          onSaved={onSaved}
          onCancel={() => setEditingId(null)}
          isNew
        />
      ) : (
        <button
          onClick={() => setEditingId('new')}
          style={{ alignSelf: 'flex-start', background: 'none', border: '1px dashed var(--border)', borderRadius: '0.5rem', padding: '0.5rem 1.25rem', fontSize: '0.875rem', cursor: 'pointer', color: 'var(--foreground)', opacity: 0.5, fontFamily: 'inherit', marginTop: '0.25rem' }}
          className="hover:opacity-100"
        >
          + Add collection
        </button>
      )}
    </div>
  )
}

// ─── Collection editor ────────────────────────────────────────────────────────

function CollectionEditor({
  collection,
  onSaved,
  onCancel,
  isNew = false,
}: {
  collection: Collection
  onSaved: (c: Collection) => void
  onCancel: () => void
  isNew?: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(collection.name)
  const [slug, setSlug] = useState(collection.slug)
  const [tagsInput, setTagsInput] = useState(collection.tags.join(', '))
  const [thumbnailUrl, setThumbnailUrl] = useState(collection.thumbnail_url ?? '')
  const [titleUppercase, setTitleUppercase] = useState(collection.title_uppercase)
  const [hidden, setHidden] = useState(collection.hidden)

  function handleNameChange(val: string) {
    setName(val)
    if (isNew) setSlug(slugify(val))
  }

  function save() {
    if (!name.trim() || !slug.trim()) { setError('Name and slug are required.'); return }
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)
    startTransition(async () => {
      try {
        const saved = await upsertCollection({
          id: collection.id || undefined,
          name: name.trim(), slug: slug.trim(), tags,
          thumbnail_url: thumbnailUrl || null,
          sort_order: collection.sort_order,
          title_uppercase: titleUppercase,
          hidden,
        })
        onSaved(saved)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save')
      }
    })
  }

  // The "primary tag" used when adding products
  const primaryTag = collection.tags[0] ?? tagsInput.split(',')[0]?.trim() ?? ''

  return (
    <div style={{ background: 'var(--muted)', borderRadius: '0 0 0.875rem 0.875rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* ── Details ── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Label>Details</Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Field label="Name">
            <input value={name} onChange={e => handleNameChange(e.target.value)} style={inputStyle} placeholder="AAPI" />
          </Field>
          <Field label="Slug">
            <input value={slug} onChange={e => setSlug(e.target.value)} style={inputStyle} placeholder="aapi" />
          </Field>
        </div>
        <Field label="Tags" hint="Comma-separated · products with any of these tags appear here">
          <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} style={inputStyle} placeholder="aapi" />
        </Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={titleUppercase}
            onChange={e => setTitleUppercase(e.target.checked)}
            style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--foreground)' }}
          />
          <span style={{ fontSize: '0.78rem', fontWeight: 500, opacity: 0.55 }}>
            Display title in all caps on the shop page
          </span>
          {titleUppercase && (
            <span style={{ fontSize: '0.72rem', opacity: 0.35, fontStyle: 'italic' }}>
              — &ldquo;{name || 'Title'}&rdquo; → &ldquo;{(name || 'Title').toUpperCase()}&rdquo;
            </span>
          )}
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={hidden}
            onChange={e => setHidden(e.target.checked)}
            style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--foreground)' }}
          />
          <span style={{ fontSize: '0.78rem', fontWeight: 500, opacity: 0.55 }}>
            Hidden — don't show in storefront or nav
          </span>
        </label>
      </section>

      {/* ── Thumbnail ── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Label>Thumbnail</Label>
        <ThumbnailPicker url={thumbnailUrl} onChange={setThumbnailUrl} />
      </section>

      {/* ── Products ── */}
      {!isNew && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Label>Products</Label>
          <ProductsSection
            collectionId={collection.id}
            collectionTags={collection.tags}
            primaryTag={primaryTag}
          />
        </section>
      )}

      {/* Save */}
      {error && <p style={{ margin: 0, fontSize: '0.8rem', color: '#991b1b' }}>{error}</p>}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={save}
          disabled={isPending}
          style={{ background: 'var(--foreground)', color: 'var(--background)', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600, cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.6 : 1, fontFamily: 'inherit' }}
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
        <Btn onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  )
}

// ─── Thumbnail picker ─────────────────────────────────────────────────────────

function ThumbnailPicker({ url, onChange }: { url: string; onChange: (url: string) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)
  const [expanded, setExpanded] = useState<Product | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleQuery(val: string) {
    setQuery(val)
    setExpanded(null)
    if (timer.current) clearTimeout(timer.current)
    if (!val.trim()) { setResults([]); return }
    setSearching(true)
    timer.current = setTimeout(async () => {
      setResults(await searchProductsWithImages(val))
      setSearching(false)
    }, 280)
  }

  function pick(imgUrl: string) {
    onChange(imgUrl)
    setOpen(false)
    setQuery('')
    setResults([])
    setExpanded(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      {/* Preview + button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Thumb url={url || null} size={72} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Btn onClick={() => setOpen(v => !v)}>{url ? 'Change photo' : 'Choose photo'}</Btn>
          {url && <Btn onClick={() => onChange('')} danger>Remove</Btn>}
        </div>
      </div>

      {/* Picker panel */}
      {open && (
        <div style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

          {!expanded ? (
            <>
              <input
                autoFocus
                value={query}
                onChange={e => handleQuery(e.target.value)}
                style={inputStyle}
                placeholder="Search products…"
              />
              {searching && <p style={hintStyle}>Searching…</p>}
              {!searching && query && results.length === 0 && <p style={hintStyle}>No products found.</p>}
              {results.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: 280, overflowY: 'auto' }}>
                  {results.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setExpanded(p)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.45rem 0.6rem', border: '1px solid var(--border)', borderRadius: '0.4rem', background: 'var(--muted)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: 'var(--foreground)', width: '100%' }}
                    >
                      <Thumb url={p.product_images[0]?.url ?? null} size={36} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 500, flex: 1 }}>{p.title}</span>
                      <span style={{ fontSize: '0.72rem', opacity: 0.35 }}>{p.product_images.length} photo{p.product_images.length !== 1 ? 's' : ''} →</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => setExpanded(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '0.8rem', opacity: 0.5, textAlign: 'left', fontFamily: 'inherit', color: 'var(--foreground)' }}
              >
                ← {expanded.title}
              </button>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {expanded.product_images.map(img => (
                  <button
                    key={img.id}
                    onClick={() => pick(img.url)}
                    style={{ width: 72, height: 72, borderRadius: '0.4rem', overflow: 'hidden', border: '2px solid var(--border)', padding: 0, cursor: 'pointer', flexShrink: 0, transition: 'border-color 0.15s' }}
                    className="hover:border-[var(--accent)]"
                    title="Use this photo"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Products section ─────────────────────────────────────────────────────────

function ProductsSection({
  collectionId,
  collectionTags,
  primaryTag,
}: {
  collectionId: string
  collectionTags: string[]
  primaryTag: string
}) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)
  const [, startTransition] = useTransition()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!collectionTags.length) { setLoading(false); return }
    getProductsInCollection(collectionTags).then(p => { setProducts(p); setLoading(false) })
  }, [collectionId]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleQuery(val: string) {
    setQuery(val)
    if (timer.current) clearTimeout(timer.current)
    if (!val.trim()) { setResults([]); return }
    setSearching(true)
    timer.current = setTimeout(async () => {
      const inIds = new Set(products.map(p => p.id))
      const res = await searchProductsWithImages(val)
      setResults(res.filter(p => !inIds.has(p.id)))
      setSearching(false)
    }, 280)
  }

  function addProduct(p: Product) {
    if (!primaryTag) return
    const newTags = p.tags.includes(primaryTag) ? p.tags : [...p.tags, primaryTag]
    startTransition(async () => {
      await updateProduct(p.id, { tags: newTags })
      setProducts(prev => [...prev, { ...p, tags: newTags }].sort((a, b) => a.title.localeCompare(b.title)))
      setResults(prev => prev.filter(r => r.id !== p.id))
      setQuery('')
    })
  }

  function removeProduct(p: Product) {
    const newTags = p.tags.filter(t => !collectionTags.includes(t))
    startTransition(async () => {
      await updateProduct(p.id, { tags: newTags })
      setProducts(prev => prev.filter(r => r.id !== p.id))
    })
  }

  if (!collectionTags.length && !primaryTag) {
    return <p style={hintStyle}>Save tags above first, then you can add products here.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Current products */}
      {loading ? (
        <p style={hintStyle}>Loading…</p>
      ) : products.length === 0 ? (
        <p style={hintStyle}>No products yet.</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
          {products.map(p => (
            <div
              key={p.id}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '0.4rem', padding: '0.25rem 0.4rem 0.25rem 0.35rem', maxWidth: 220 }}
            >
              <Thumb url={p.product_images[0]?.url ?? null} size={26} />
              <span style={{ fontSize: '0.78rem', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
              <button
                onClick={() => removeProduct(p)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0.1rem', fontSize: '0.9rem', opacity: 0.35, lineHeight: 1, color: 'var(--foreground)', fontFamily: 'inherit', flexShrink: 0 }}
                className="hover:opacity-80"
                title="Remove from collection"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search to add */}
      <Field label="Add products">
        <div style={{ position: 'relative' }}>
          <input
            value={query}
            onChange={e => handleQuery(e.target.value)}
            style={inputStyle}
            placeholder="Search by product name…"
          />
          {searching && <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.72rem', opacity: 0.4 }}>Searching…</span>}
        </div>
      </Field>

      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: 240, overflowY: 'auto' }}>
          {results.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0.6rem', border: '1px solid var(--border)', borderRadius: '0.4rem', background: 'var(--background)' }}>
              <Thumb url={p.product_images[0]?.url ?? null} size={32} />
              <span style={{ fontSize: '0.83rem', flex: 1 }}>{p.title}</span>
              <button
                onClick={() => addProduct(p)}
                style={{ background: 'var(--foreground)', color: 'var(--background)', border: 'none', borderRadius: '0.35rem', padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
              >
                Add
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function Thumb({ url, size }: { url: string | null; size: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '0.35rem', overflow: 'hidden', flexShrink: 0, background: 'var(--border)' }}>
      {url
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2, fontSize: size * 0.4 }}>□</div>
      }
    </div>
  )
}

function Btn({ children, onClick, danger = false }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '0.4rem', padding: '0.35rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer', color: danger ? '#991b1b' : 'var(--foreground)', opacity: 0.6, fontFamily: 'inherit' }}
      className="hover:opacity-100"
    >
      {children}
    </button>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', opacity: 0.4 }}>{children}</p>
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <span style={{ fontSize: '0.78rem', fontWeight: 500, opacity: 0.55 }}>
        {label}{hint && <span style={{ fontWeight: 400, opacity: 0.75 }}> — {hint}</span>}
      </span>
      {children}
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '0.55rem 0.75rem',
  borderRadius: '0.5rem',
  border: '1px solid var(--border)',
  background: 'var(--background)',
  fontSize: '0.875rem',
  color: 'var(--foreground)',
  fontFamily: 'inherit',
  width: '100%',
}

const hintStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '0.8rem',
  opacity: 0.4,
}
