'use client'

import { useState, useTransition } from 'react'
import ThumbnailPicker from '@/components/admin/ThumbnailPicker'
import { saveBanner, deleteBanner, uploadBannerImage } from './actions'
import type { SeasonalBanner } from '@/lib/seasonal'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatRange(b: SeasonalBanner) {
  return `${MONTH_NAMES[b.start_month - 1]} ${b.start_day} – ${MONTH_NAMES[b.end_month - 1]} ${b.end_day}`
}

function isLive(b: SeasonalBanner) {
  if (!b.is_active) return false
  const now = new Date()
  const cur = (now.getMonth() + 1) * 100 + now.getDate()
  const start = b.start_month * 100 + b.start_day
  const end = b.end_month * 100 + b.end_day
  return start <= end ? cur >= start && cur <= end : cur >= start || cur <= end
}

type FormState = {
  name: string
  start_month: number; start_day: number
  end_month: number; end_day: number
  priority: number
  is_active: boolean
  hero_image_url: string
  hero_headline: string; hero_subtext: string
  hero_cta_label: string; hero_cta_url: string
  feature_headline: string; feature_subtext: string
  feature_image_url: string
  feature_cta_label: string; feature_cta_url: string
}

const emptyForm: FormState = {
  name: '', start_month: 1, start_day: 1, end_month: 1, end_day: 31,
  priority: 0, is_active: true,
  hero_image_url: '', hero_headline: '', hero_subtext: '', hero_cta_label: '', hero_cta_url: '',
  feature_headline: '', feature_subtext: '', feature_image_url: '', feature_cta_label: '', feature_cta_url: '',
}

function bannerToForm(b: SeasonalBanner): FormState {
  return {
    name: b.name,
    start_month: b.start_month, start_day: b.start_day,
    end_month: b.end_month, end_day: b.end_day,
    priority: b.priority, is_active: b.is_active,
    hero_image_url: b.hero_image_url ?? '',
    hero_headline: b.hero_headline ?? '',
    hero_subtext: b.hero_subtext ?? '',
    hero_cta_label: b.hero_cta_label ?? '',
    hero_cta_url: b.hero_cta_url ?? '',
    feature_headline: b.feature_headline ?? '',
    feature_subtext: b.feature_subtext ?? '',
    feature_image_url: b.feature_image_url ?? '',
    feature_cta_label: b.feature_cta_label ?? '',
    feature_cta_url: b.feature_cta_url ?? '',
  }
}

export default function BannerManager({ initialBanners }: { initialBanners: SeasonalBanner[] }) {
  const [banners, setBanners] = useState(initialBanners)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function startNew() {
    setForm(emptyForm)
    setEditingId('new')
    setError(null)
  }

  function startEdit(b: SeasonalBanner) {
    setForm(bannerToForm(b))
    setEditingId(b.id)
    setError(null)
  }

  function cancel() {
    setEditingId(null)
    setError(null)
  }

  function set(key: keyof FormState, value: string | number | boolean) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this banner?')) return
    startTransition(async () => {
      await deleteBanner(id)
      setBanners(prev => prev.filter(b => b.id !== id))
      if (editingId === id) cancel()
    })
  }

  function handleSave() {
    if (!form.name.trim()) { setError('Name is required.'); return }
    startTransition(async () => {
      try {
        const saved = await saveBanner({
          ...(editingId !== 'new' && editingId ? { id: editingId } : {}),
          name: form.name,
          start_month: form.start_month, start_day: form.start_day,
          end_month: form.end_month, end_day: form.end_day,
          priority: form.priority, is_active: form.is_active,
          hero_image_url: form.hero_image_url || null,
          hero_headline: form.hero_headline || null,
          hero_subtext: form.hero_subtext || null,
          hero_cta_label: form.hero_cta_label || null,
          hero_cta_url: form.hero_cta_url || null,
          feature_headline: form.feature_headline || null,
          feature_subtext: form.feature_subtext || null,
          feature_image_url: form.feature_image_url || null,
          feature_cta_label: form.feature_cta_label || null,
          feature_cta_url: form.feature_cta_url || null,
        })
        setBanners(prev =>
          editingId === 'new'
            ? [...prev, saved].sort((a, b) => b.priority - a.priority)
            : prev.map(b => b.id === saved.id ? saved : b)
        )
        cancel()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save')
      }
    })
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 400, margin: '0 0 0.25rem' }}>
            Homepage Banners
          </h1>
          <p style={{ fontSize: '0.875rem', opacity: 0.5, margin: 0 }}>
            Seasonal hero overrides and feature sections. The right one activates automatically based on today's date.
          </p>
        </div>
        <button
          type="button"
          onClick={startNew}
          style={{ background: 'var(--foreground)', color: 'var(--background)', padding: '0.625rem 1.25rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
        >
          + New Banner
        </button>
      </div>

      {/* ── Form ── */}
      {editingId !== null && (
        <div style={{ border: '1px solid var(--border)', borderRadius: '0.875rem', marginBottom: '2rem', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 400, margin: 0 }}>
              {editingId === 'new' ? 'New Banner' : `Editing: ${form.name || '…'}`}
            </h2>
          </div>

          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Basic info */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <SectionLabel>Basic Info</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                <Field label="Name *" style={{ gridColumn: 'span 2' }}>
                  <input value={form.name} onChange={e => set('name', e.target.value)} style={inp} placeholder="Valentine's Day" />
                </Field>
                <Field label="Priority (higher wins ties)">
                  <input type="number" value={form.priority} onChange={e => set('priority', parseInt(e.target.value) || 0)} style={inp} />
                </Field>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 500, paddingTop: '1.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} style={{ width: 15, height: 15, accentColor: 'var(--foreground)', cursor: 'pointer' }} />
                  Active
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                <Field label="Start month (1–12)">
                  <input type="number" min={1} max={12} value={form.start_month} onChange={e => set('start_month', parseInt(e.target.value) || 1)} style={inp} />
                </Field>
                <Field label="Start day">
                  <input type="number" min={1} max={31} value={form.start_day} onChange={e => set('start_day', parseInt(e.target.value) || 1)} style={inp} />
                </Field>
                <Field label="End month (1–12)">
                  <input type="number" min={1} max={12} value={form.end_month} onChange={e => set('end_month', parseInt(e.target.value) || 1)} style={inp} />
                </Field>
                <Field label="End day">
                  <input type="number" min={1} max={31} value={form.end_day} onChange={e => set('end_day', parseInt(e.target.value) || 31)} style={inp} />
                </Field>
              </div>
            </section>

            {/* Hero overrides */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <SectionLabel>Hero Section — optional overrides (leave blank to keep the default hero)</SectionLabel>
              <Field label="Background image">
                <ThumbnailPicker url={form.hero_image_url} onChange={url => set('hero_image_url', url)} label="hero image" uploadAction={uploadBannerImage} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <Field label="Headline">
                  <input value={form.hero_headline} onChange={e => set('hero_headline', e.target.value)} style={inp} placeholder="Love is in the details." />
                </Field>
                <Field label="Subtext">
                  <input value={form.hero_subtext} onChange={e => set('hero_subtext', e.target.value)} style={inp} placeholder="Handpainted cards and gifts…" />
                </Field>
                <Field label="CTA label">
                  <input value={form.hero_cta_label} onChange={e => set('hero_cta_label', e.target.value)} style={inp} placeholder="Shop Now" />
                </Field>
                <Field label="CTA URL">
                  <input value={form.hero_cta_url} onChange={e => set('hero_cta_url', e.target.value)} style={inp} placeholder="/shop" />
                </Field>
              </div>
            </section>

            {/* Feature section */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <SectionLabel>
                Feature Section — editorial block below collections, above new arrivals
              </SectionLabel>
              <p style={{ margin: 0, fontSize: '0.78rem', opacity: 0.45, lineHeight: 1.5 }}>
                This is a full-width split section spotlighting a seasonal collection. Set the CTA URL to{' '}
                <code style={{ fontSize: '0.75rem', background: 'var(--border)', padding: '0.1rem 0.3rem', borderRadius: '0.25rem' }}>/shop?collection=california</code>{' '}
                or any collection slug to link to it. Leave Headline blank to hide the section entirely.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <Field label="Headline (leave blank to hide section)">
                  <input value={form.feature_headline} onChange={e => set('feature_headline', e.target.value)} style={inp} placeholder="Made with love." />
                </Field>
                <Field label="Subtext">
                  <input value={form.feature_subtext} onChange={e => set('feature_subtext', e.target.value)} style={inp} placeholder="Find something that says it perfectly." />
                </Field>
                <Field label="CTA label">
                  <input value={form.feature_cta_label} onChange={e => set('feature_cta_label', e.target.value)} style={inp} placeholder="Shop the Collection" />
                </Field>
                <Field label="CTA URL">
                  <input value={form.feature_cta_url} onChange={e => set('feature_cta_url', e.target.value)} style={inp} placeholder="/shop?collection=california" />
                  {collectionSlug(form.feature_cta_url) && (
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.375rem' }}>
                      <a
                        href="/admin/collections"
                        style={{ fontSize: '0.75rem', opacity: 0.5, textDecoration: 'none', color: 'var(--foreground)' }}
                        className="hover:opacity-100"
                      >
                        Manage collection →
                      </a>
                      <a
                        href={form.feature_cta_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '0.75rem', opacity: 0.5, textDecoration: 'none', color: 'var(--foreground)' }}
                        className="hover:opacity-100"
                      >
                        Preview in store ↗
                      </a>
                    </div>
                  )}
                </Field>
              </div>
              <Field label="Feature image (shown on the right side of the section)">
                <ThumbnailPicker url={form.feature_image_url} onChange={url => set('feature_image_url', url)} label="feature image" uploadAction={uploadBannerImage} />
              </Field>
            </section>

            {error && <p style={{ margin: 0, fontSize: '0.8rem', color: '#991b1b' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                style={{ background: 'var(--foreground)', color: 'var(--background)', border: 'none', padding: '0.625rem 1.5rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600, cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.6 : 1, fontFamily: 'inherit' }}
              >
                {isPending ? 'Saving…' : 'Save Banner'}
              </button>
              <button
                type="button"
                onClick={cancel}
                style={{ background: 'none', border: '1px solid var(--border)', padding: '0.625rem 1.25rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', color: 'var(--foreground)', fontFamily: 'inherit' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Banner list ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {banners.map(b => {
          const live = isLive(b)
          return (
            <div
              key={b.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem 1.25rem',
                borderRadius: '0.625rem',
                border: `1px solid ${live ? 'var(--accent-border)' : 'var(--border)'}`,
                background: live ? '#fffbf0' : 'var(--background)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{b.name}</span>
                  {live && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'var(--accent)', color: 'var(--foreground)', padding: '0.15rem 0.5rem', borderRadius: '999px' }}>
                      Active now
                    </span>
                  )}
                  {!b.is_active && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.35, padding: '0.15rem 0.5rem', borderRadius: '999px', border: '1px solid currentColor' }}>
                      Disabled
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.8rem', opacity: 0.5, margin: 0 }}>
                  {formatRange(b)} · Priority {b.priority}
                  {b.feature_headline && ` · "${b.feature_headline}"`}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => startEdit(b)}
                  style={{ fontSize: '0.8rem', fontWeight: 500, padding: '0.375rem 0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--foreground)', fontFamily: 'inherit' }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(b.id)}
                  style={{ fontSize: '0.8rem', fontWeight: 500, padding: '0.375rem 0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--foreground)', fontFamily: 'inherit', opacity: 0.5 }}
                  className="hover:opacity-100"
                >
                  Delete
                </button>
              </div>
            </div>
          )
        })}
        {banners.length === 0 && (
          <p style={{ opacity: 0.4, fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>
            No banners yet. Click + New Banner to add one.
          </p>
        )}
      </div>
    </div>
  )
}

function collectionSlug(url: string): string | null {
  try {
    const match = url.match(/[?&]collection=([^&]+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.4 }}>
      {children}
    </p>
  )
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', ...style }}>
      <span style={{ fontSize: '0.78rem', fontWeight: 500, opacity: 0.55 }}>{label}</span>
      {children}
    </div>
  )
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
