'use client'

import { useState, useRef } from 'react'
import { searchProductsWithImages } from '@/app/admin/actions'

type ProductImage = { id: string; url: string; position: number }
type Product = { id: string; title: string; product_images: ProductImage[] }
type Tab = 'search' | 'upload'

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

export default function ThumbnailPicker({
  url,
  onChange,
  label = 'photo',
  uploadAction,
}: {
  url: string
  onChange: (url: string) => void
  label?: string
  uploadAction?: (formData: FormData) => Promise<string>
}) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('search')

  // Search state
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)
  const [expanded, setExpanded] = useState<Product | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Upload state
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleQuery(val: string) {
    setQuery(val)
    setExpanded(null)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!val.trim()) { setResults([]); return }
    setSearching(true)
    searchTimer.current = setTimeout(async () => {
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

  async function handleFiles(files: FileList | File[]) {
    if (!uploadAction) return
    const file = Array.from(files).find(f => f.type.startsWith('image/'))
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const uploaded = await uploadAction(fd)
      pick(uploaded)
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function openPicker() {
    setOpen(v => !v)
    // Default to upload tab if no uploadAction, else search
    setTab('search')
  }

  const inp: React.CSSProperties = {
    padding: '0.55rem 0.75rem',
    borderRadius: '0.5rem',
    border: '1px solid var(--border)',
    background: 'var(--background)',
    fontSize: '0.875rem',
    color: 'var(--foreground)',
    fontFamily: 'inherit',
    width: '100%',
  }

  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '0.5rem',
    border: 'none',
    borderBottom: `2px solid ${active ? 'var(--foreground)' : 'transparent'}`,
    background: 'transparent',
    fontSize: '0.8rem',
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    color: 'var(--foreground)',
    opacity: active ? 1 : 0.45,
    fontFamily: 'inherit',
    transition: 'opacity 0.15s, border-color 0.15s',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Preview + trigger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Thumb url={url || null} size={72} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={openPicker}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '0.4rem', padding: '0.35rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--foreground)', fontFamily: 'inherit' }}
            className="hover:opacity-70"
          >
            {url ? `Change ${label}` : `Choose ${label}`}
          </button>
          {url && (
            <button
              type="button"
              onClick={() => onChange('')}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '0.4rem', padding: '0.35rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer', color: '#991b1b', fontFamily: 'inherit', opacity: 0.7 }}
              className="hover:opacity-100"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Picker panel */}
      {open && (
        <div style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '0.75rem', overflow: 'hidden' }}>

          {/* Tabs */}
          {uploadAction && (
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
              <button type="button" style={tabBtn(tab === 'search')} onClick={() => setTab('search')}>
                Search products
              </button>
              <button type="button" style={tabBtn(tab === 'upload')} onClick={() => setTab('upload')}>
                Upload from computer
              </button>
            </div>
          )}

          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

            {/* ── Search tab ── */}
            {tab === 'search' && (
              !expanded ? (
                <>
                  <input
                    autoFocus
                    value={query}
                    onChange={e => handleQuery(e.target.value)}
                    style={inp}
                    placeholder="Search products…"
                  />
                  {searching && <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.4 }}>Searching…</p>}
                  {!searching && query && results.length === 0 && (
                    <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.4 }}>No products found.</p>
                  )}
                  {results.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: 280, overflowY: 'auto' }}>
                      {results.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setExpanded(p)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.45rem 0.6rem', border: '1px solid var(--border)', borderRadius: '0.4rem', background: 'var(--muted)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: 'var(--foreground)', width: '100%' }}
                        >
                          <Thumb url={p.product_images[0]?.url ?? null} size={36} />
                          <span style={{ fontSize: '0.85rem', fontWeight: 500, flex: 1 }}>{p.title}</span>
                          <span style={{ fontSize: '0.72rem', opacity: 0.35 }}>
                            {p.product_images.length} photo{p.product_images.length !== 1 ? 's' : ''} →
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setExpanded(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '0.8rem', opacity: 0.5, textAlign: 'left', fontFamily: 'inherit', color: 'var(--foreground)' }}
                  >
                    ← {expanded.title}
                  </button>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {expanded.product_images
                      .slice()
                      .sort((a, b) => a.position - b.position)
                      .map(img => (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => pick(img.url)}
                          style={{ width: 80, height: 80, borderRadius: '0.4rem', overflow: 'hidden', border: '2px solid var(--border)', padding: 0, cursor: 'pointer', flexShrink: 0, transition: 'border-color 0.15s' }}
                          className="hover:border-[var(--accent)]"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        </button>
                      ))}
                  </div>
                </>
              )
            )}

            {/* ── Upload tab ── */}
            {tab === 'upload' && uploadAction && (
              <>
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={e => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files) }}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${isDragging ? 'var(--foreground)' : 'var(--border)'}`,
                    borderRadius: '0.625rem',
                    padding: '2rem 1rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: isDragging ? 'color-mix(in srgb, var(--foreground) 4%, transparent)' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => e.target.files && handleFiles(e.target.files)}
                  />
                  <p style={{ margin: 0, fontSize: '0.875rem', opacity: uploading ? 0.4 : 0.6 }}>
                    {uploading ? 'Uploading…' : isDragging ? 'Drop to upload' : 'Drag an image here, or click to browse'}
                  </p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', opacity: 0.35 }}>JPG, PNG, WebP</p>
                </div>
                {uploadError && (
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#991b1b' }}>{uploadError}</p>
                )}
              </>
            )}

          </div>
        </div>
      )}
    </div>
  )
}
