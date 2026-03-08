'use client'

import { useState, useTransition } from 'react'
import {
  upsertCollection,
  deleteCollection,
} from '../actions'

type Collection = {
  id: string
  name: string
  slug: string
  tags: string[]
  thumbnail_url: string | null
  sort_order: number
}

type FormState = {
  id?: string
  name: string
  slug: string
  tags: string
  thumbnail_url: string
  sort_order: number
}

function emptyForm(sort_order = 0): FormState {
  return { name: '', slug: '', tags: '', thumbnail_url: '', sort_order }
}

function toFormState(c: Collection): FormState {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    tags: c.tags.join(', '),
    thumbnail_url: c.thumbnail_url ?? '',
    sort_order: c.sort_order,
  }
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

export default function CollectionsManager({ collections: initial }: { collections: Collection[] }) {
  const [collections, setCollections] = useState<Collection[]>(initial)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function startEdit(c: Collection) {
    setEditingId(c.id)
    setForm(toFormState(c))
    setError(null)
  }

  function startNew() {
    setEditingId('new')
    setForm(emptyForm(collections.length + 1))
    setError(null)
  }

  function cancel() {
    setEditingId(null)
    setError(null)
  }

  function handleNameChange(value: string) {
    setForm(f => ({
      ...f,
      name: value,
      slug: f.id ? f.slug : slugify(value),
    }))
  }

  function save() {
    if (!form.name.trim() || !form.slug.trim()) {
      setError('Name and slug are required.')
      return
    }
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    startTransition(async () => {
      try {
        const saved = await upsertCollection({
          id: form.id,
          name: form.name.trim(),
          slug: form.slug.trim(),
          tags,
          thumbnail_url: form.thumbnail_url.trim() || null,
          sort_order: form.sort_order,
        })
        setCollections(prev => {
          const without = prev.filter(c => c.id !== saved.id)
          return [...without, saved].sort((a, b) => a.sort_order - b.sort_order)
        })
        setEditingId(null)
        setError(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save')
      }
    })
  }

  function remove(id: string) {
    if (!confirm('Delete this collection? Products using this tag will still exist.')) return
    startTransition(async () => {
      try {
        await deleteCollection(id)
        setCollections(prev => prev.filter(c => c.id !== id))
        if (editingId === id) setEditingId(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to delete')
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

      {/* List */}
      {collections.map(c => (
        <div key={c.id}>
          {editingId === c.id ? (
            <CollectionForm
              form={form}
              setForm={setForm}
              onNameChange={handleNameChange}
              onSave={save}
              onCancel={cancel}
              isPending={isPending}
              error={error}
              isEdit
            />
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              background: 'var(--muted)',
              borderRadius: '0.75rem',
              padding: '0.875rem 1.25rem',
            }}>
              {/* Thumbnail */}
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '0.4rem',
                overflow: 'hidden',
                flexShrink: 0,
                background: 'var(--border)',
              }}>
                {c.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3, fontSize: '1.25rem' }}>
                    🖼
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 500, fontSize: '0.9rem' }}>{c.name}</p>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', opacity: 0.45 }}>
                  /{c.slug} · tags: {c.tags.length > 0 ? c.tags.join(', ') : <em>none</em>}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => startEdit(c)}
                  style={ghostBtn}
                  className="hover:opacity-100"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  style={{ ...ghostBtn, color: '#991b1b' }}
                  className="hover:opacity-100"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add new */}
      {editingId === 'new' ? (
        <CollectionForm
          form={form}
          setForm={setForm}
          onNameChange={handleNameChange}
          onSave={save}
          onCancel={cancel}
          isPending={isPending}
          error={error}
          isEdit={false}
        />
      ) : (
        <button
          type="button"
          onClick={startNew}
          style={{
            alignSelf: 'flex-start',
            background: 'none',
            border: '1px dashed var(--border)',
            borderRadius: '0.5rem',
            padding: '0.5rem 1.25rem',
            fontSize: '0.875rem',
            cursor: 'pointer',
            color: 'var(--foreground)',
            opacity: 0.55,
            fontFamily: 'inherit',
          }}
          className="hover:opacity-100"
        >
          + Add collection
        </button>
      )}
    </div>
  )
}

function CollectionForm({
  form,
  setForm,
  onNameChange,
  onSave,
  onCancel,
  isPending,
  error,
  isEdit,
}: {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  onNameChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
  isPending: boolean
  error: string | null
  isEdit: boolean
}) {
  return (
    <div style={{
      background: 'var(--muted)',
      borderRadius: '0.875rem',
      padding: '1.25rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    }}>
      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>
        {isEdit ? 'Edit collection' : 'New collection'}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <label style={labelStyle}>
          <span style={labelText}>Name</span>
          <input
            type="text"
            value={form.name}
            onChange={e => onNameChange(e.target.value)}
            style={inputStyle}
            placeholder="California"
          />
        </label>
        <label style={labelStyle}>
          <span style={labelText}>Slug</span>
          <input
            type="text"
            value={form.slug}
            onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
            style={inputStyle}
            placeholder="california"
          />
        </label>
      </div>

      <label style={labelStyle}>
        <span style={labelText}>Tags <span style={{ opacity: 0.5, fontWeight: 400 }}>(comma-separated — products with any of these tags appear in this collection)</span></span>
        <input
          type="text"
          value={form.tags}
          onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
          style={inputStyle}
          placeholder="california, ca"
        />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', alignItems: 'end' }}>
        <label style={labelStyle}>
          <span style={labelText}>Thumbnail URL</span>
          <input
            type="text"
            value={form.thumbnail_url}
            onChange={e => setForm(f => ({ ...f, thumbnail_url: e.target.value }))}
            style={inputStyle}
            placeholder="https://..."
          />
        </label>
        {form.thumbnail_url && (
          <div style={{ width: 56, height: 56, borderRadius: '0.4rem', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        )}
      </div>

      <label style={labelStyle}>
        <span style={labelText}>Sort order</span>
        <input
          type="number"
          value={form.sort_order}
          onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
          style={{ ...inputStyle, width: 80 }}
          min="0"
        />
      </label>

      {error && (
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#991b1b' }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          type="button"
          onClick={onSave}
          disabled={isPending}
          style={{
            background: 'var(--foreground)',
            color: 'var(--background)',
            border: 'none',
            padding: '0.55rem 1.25rem',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: isPending ? 'not-allowed' : 'pointer',
            opacity: isPending ? 0.6 : 1,
            fontFamily: 'inherit',
          }}
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} style={{ ...ghostBtn, opacity: 0.5 }} className="hover:opacity-100">
          Cancel
        </button>
      </div>
    </div>
  )
}

const ghostBtn: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--border)',
  borderRadius: '0.4rem',
  padding: '0.35rem 0.75rem',
  fontSize: '0.8rem',
  cursor: 'pointer',
  color: 'var(--foreground)',
  opacity: 0.6,
  fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
}

const labelText: React.CSSProperties = {
  fontSize: '0.78rem',
  fontWeight: 500,
  opacity: 0.55,
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
