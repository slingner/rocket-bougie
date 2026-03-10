import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { SeasonalBanner } from '@/lib/seasonal'
import { saveBanner, deleteBanner } from './actions'

export const metadata = { title: 'Homepage Banners | Admin' }

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

const input: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  border: '1px solid var(--border)',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  background: 'var(--background)',
  color: 'var(--foreground)',
  width: '100%',
}

const label: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.375rem',
  fontSize: '0.8rem',
  fontWeight: 500,
}

const legend: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  opacity: 0.4,
  marginBottom: '1rem',
}

export default async function HomepageBannersPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>
}) {
  const { edit } = await searchParams
  const supabase = createAdminClient()

  const { data: banners } = await supabase
    .from('seasonal_banners')
    .select('*')
    .order('priority', { ascending: false })

  const editing = edit && edit !== 'new'
    ? ((banners ?? []) as SeasonalBanner[]).find(b => b.id === edit) ?? null
    : null
  const isNew = edit === 'new'

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 400, margin: '0 0 0.25rem' }}>
            Homepage Banners
          </h1>
          <p style={{ fontSize: '0.875rem', opacity: 0.5, margin: 0 }}>
            Seasonal hero overrides and feature sections. Activate automatically by date range.
          </p>
        </div>
        <Link
          href="/admin/homepage?edit=new"
          style={{
            background: 'var(--foreground)',
            color: 'var(--background)',
            padding: '0.625rem 1.25rem',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          + New Banner
        </Link>
      </div>

      {/* Form */}
      {(isNew || editing) && (
        <div style={{ border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '2rem', background: 'var(--muted)' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 400, margin: '0 0 1.5rem' }}>
            {isNew ? 'New Banner' : `Edit: ${editing!.name}`}
          </h2>
          <form action={saveBanner} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <input type="hidden" name="id" value={editing?.id ?? 'new'} />

            {/* Basic info */}
            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend style={legend}>Basic Info</legend>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <label style={{ ...label, gridColumn: 'span 2' }}>
                  Name *
                  <input name="name" defaultValue={editing?.name ?? ''} required style={input} placeholder="Valentine's Day" />
                </label>
                <label style={label}>
                  Priority (higher wins ties)
                  <input name="priority" type="number" defaultValue={editing?.priority ?? 0} style={input} />
                </label>
                <label style={{ ...label, flexDirection: 'row', alignItems: 'center', gap: '0.5rem', paddingTop: '1.5rem' }}>
                  <input name="is_active" type="checkbox" defaultChecked={editing?.is_active ?? true} />
                  Active
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                <label style={label}>
                  Start month
                  <input name="start_month" type="number" min={1} max={12} defaultValue={editing?.start_month ?? 1} required style={input} />
                </label>
                <label style={label}>
                  Start day
                  <input name="start_day" type="number" min={1} max={31} defaultValue={editing?.start_day ?? 1} required style={input} />
                </label>
                <label style={label}>
                  End month
                  <input name="end_month" type="number" min={1} max={12} defaultValue={editing?.end_month ?? 1} required style={input} />
                </label>
                <label style={label}>
                  End day
                  <input name="end_day" type="number" min={1} max={31} defaultValue={editing?.end_day ?? 31} required style={input} />
                </label>
              </div>
            </fieldset>

            {/* Hero overrides */}
            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend style={legend}>Hero Section — optional overrides (leave blank to keep default)</legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <label style={{ ...label, gridColumn: '1 / -1' }}>
                  Background image URL
                  <input name="hero_image_url" defaultValue={editing?.hero_image_url ?? ''} style={input} placeholder="https://..." />
                </label>
                <label style={label}>
                  Headline
                  <input name="hero_headline" defaultValue={editing?.hero_headline ?? ''} style={input} placeholder="Love is in the details." />
                </label>
                <label style={label}>
                  Subtext
                  <input name="hero_subtext" defaultValue={editing?.hero_subtext ?? ''} style={input} placeholder="Handpainted cards and gifts..." />
                </label>
                <label style={label}>
                  CTA label
                  <input name="hero_cta_label" defaultValue={editing?.hero_cta_label ?? ''} style={input} placeholder="Shop Now" />
                </label>
                <label style={label}>
                  CTA URL
                  <input name="hero_cta_url" defaultValue={editing?.hero_cta_url ?? ''} style={input} placeholder="/shop" />
                </label>
              </div>
            </fieldset>

            {/* Feature section */}
            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend style={legend}>Feature Section — editorial block below collections (leave headline blank to hide)</legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <label style={label}>
                  Headline
                  <input name="feature_headline" defaultValue={editing?.feature_headline ?? ''} style={input} placeholder="Made with love." />
                </label>
                <label style={label}>
                  Subtext
                  <input name="feature_subtext" defaultValue={editing?.feature_subtext ?? ''} style={input} placeholder="Find something that says it perfectly." />
                </label>
                <label style={{ ...label, gridColumn: '1 / -1' }}>
                  Feature image URL
                  <input name="feature_image_url" defaultValue={editing?.feature_image_url ?? ''} style={input} placeholder="https://..." />
                </label>
                <label style={label}>
                  CTA label
                  <input name="feature_cta_label" defaultValue={editing?.feature_cta_label ?? ''} style={input} placeholder="Shop the Collection" />
                </label>
                <label style={label}>
                  CTA URL
                  <input name="feature_cta_url" defaultValue={editing?.feature_cta_url ?? ''} style={input} placeholder="/shop" />
                </label>
              </div>
            </fieldset>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="submit"
                style={{
                  background: 'var(--foreground)',
                  color: 'var(--background)',
                  padding: '0.625rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Save Banner
              </button>
              <Link
                href="/admin/homepage"
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  border: '1px solid var(--border)',
                  textDecoration: 'none',
                  color: 'var(--foreground)',
                }}
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      )}

      {/* Banner list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {((banners ?? []) as SeasonalBanner[]).map((b) => {
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
                <Link
                  href={`/admin/homepage?edit=${b.id}`}
                  style={{ fontSize: '0.8rem', fontWeight: 500, padding: '0.375rem 0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border)', textDecoration: 'none', color: 'var(--foreground)' }}
                >
                  Edit
                </Link>
                <form action={deleteBanner.bind(null, b.id)}>
                  <button
                    type="submit"
                    style={{ fontSize: '0.8rem', fontWeight: 500, padding: '0.375rem 0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--foreground)', opacity: 0.5 }}
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          )
        })}
        {!banners?.length && (
          <p style={{ opacity: 0.4, fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>
            No banners yet. Click + New Banner to add one.
          </p>
        )}
      </div>
    </div>
  )
}
