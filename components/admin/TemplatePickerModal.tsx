'use client'

import { useEffect } from 'react'
import { TEMPLATES, type TemplateId, type TemplateInfo } from '@/app/admin/newsletter/email-templates'

type Props = {
  current: TemplateId
  onSelect: (id: TemplateId) => void
  onClose: () => void
}

export default function TemplatePickerModal({ current, onSelect, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,8,6,0.72)',
        backdropFilter: 'blur(3px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--background)',
          borderRadius: '1rem',
          padding: '2rem',
          maxWidth: 820,
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 400, margin: 0, letterSpacing: '-0.01em' }}>
              Choose a template
            </h2>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', opacity: 0.45 }}>
              If your body is empty, switching templates will load its sample content.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', opacity: 0.4, padding: '4px 8px', color: 'var(--foreground)', fontFamily: 'inherit' }}
            className="hover:opacity-100"
          >
            ✕
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1rem',
            marginTop: '1.5rem',
          }}
        >
          {TEMPLATES.map(t => (
            <TemplateCard
              key={t.id}
              template={t}
              selected={t.id === current}
              onSelect={() => { onSelect(t.id); onClose() }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function TemplateCard({ template, selected, onSelect }: {
  template: TemplateInfo
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        background: selected ? '#fff8f8' : 'var(--muted)',
        border: `2px solid ${selected ? '#ffaaaa' : 'transparent'}`,
        borderRadius: '0.75rem',
        padding: '1rem',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      className="hover:border-[#ffaaaa]"
    >
      {/* Layout preview */}
      <div style={{ marginBottom: '0.875rem' }}>
        <LayoutPreview id={template.id} />
      </div>

      <p style={{ margin: '0 0 2px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground)' }}>
        {template.name}
      </p>
      <p style={{ margin: '0 0 6px', fontSize: '0.73rem', opacity: 0.5, lineHeight: 1.4 }}>
        {template.description}
      </p>
      {/* Sample subject line as a hint */}
      <p style={{
        margin: 0,
        fontSize: '0.7rem',
        fontStyle: 'italic',
        opacity: 0.4,
        lineHeight: 1.3,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        e.g. "{template.defaultSubject}"
      </p>
      {template.hasImage && (
        <span style={{
          display: 'inline-block',
          marginTop: '0.5rem',
          fontSize: '0.68rem',
          fontWeight: 600,
          padding: '0.15rem 0.5rem',
          borderRadius: '100px',
          background: '#fef3c7',
          color: '#92400e',
          letterSpacing: '0.02em',
        }}>
          + image
        </span>
      )}
    </button>
  )
}

// CSS-drawn layout sketches for each template
function LayoutPreview({ id }: { id: TemplateId }) {
  const bg = '#f5f2ee'
  const card = '#ffffff'
  const coral = '#ffaaaa'
  const line = '#e0dbd2'
  const textDark = '#c8c0b8'
  const textLight = '#ddd8d2'

  const base: React.CSSProperties = {
    width: '100%',
    height: 130,
    background: bg,
    borderRadius: '0.5rem',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  }

  if (id === 'classic') return (
    <div style={base}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 8px' }}>
        <div style={{ width: 60, height: 6, background: textDark, borderRadius: 3 }} />
      </div>
      <div style={{ height: 1, background: line, margin: '0 12px 8px' }} />
      <div style={{ flex: 1, background: card, margin: '0 10px', borderRadius: '6px 6px 0 0', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ width: '85%', height: 5, background: textDark, borderRadius: 3 }} />
        <div style={{ width: '70%', height: 5, background: textLight, borderRadius: 3 }} />
        <div style={{ width: '90%', height: 5, background: textLight, borderRadius: 3 }} />
        <div style={{ width: '60%', height: 5, background: textLight, borderRadius: 3 }} />
      </div>
    </div>
  )

  if (id === 'hero') return (
    <div style={base}>
      <div style={{ height: 50, background: 'linear-gradient(135deg,#ffaaaa,#fdd5c0)', flexShrink: 0 }} />
      <div style={{ height: 18, background: coral, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <div style={{ width: 40, height: 4, background: 'rgba(26,26,26,0.35)', borderRadius: 2 }} />
      </div>
      <div style={{ flex: 1, background: card, padding: '7px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ width: '80%', height: 4, background: textDark, borderRadius: 2 }} />
        <div style={{ width: '65%', height: 4, background: textLight, borderRadius: 2 }} />
        <div style={{ width: '75%', height: 4, background: textLight, borderRadius: 2 }} />
      </div>
    </div>
  )

  if (id === 'editorial') return (
    <div style={base}>
      <div style={{ padding: '12px 14px 0' }}>
        <div style={{ width: 44, height: 3, background: textLight, borderRadius: 2, marginBottom: 10 }} />
        <div style={{ width: '90%', height: 11, background: textDark, borderRadius: 3, marginBottom: 4 }} />
        <div style={{ width: '65%', height: 11, background: textDark, borderRadius: 3, marginBottom: 6 }} />
        <div style={{ width: 28, height: 3, background: coral, borderRadius: 2, marginBottom: 8 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ width: '100%', height: 4, background: textLight, borderRadius: 2 }} />
          <div style={{ width: '88%', height: 4, background: textLight, borderRadius: 2 }} />
          <div style={{ width: '75%', height: 4, background: textLight, borderRadius: 2 }} />
        </div>
      </div>
    </div>
  )

  if (id === 'announcement') return (
    <div style={base}>
      <div style={{ background: coral, padding: '10px 12px 10px', flexShrink: 0 }}>
        <div style={{ width: 32, height: 3, background: 'rgba(26,26,26,0.3)', borderRadius: 2, marginBottom: 6 }} />
        <div style={{ width: '85%', height: 8, background: 'rgba(26,26,26,0.25)', borderRadius: 3, marginBottom: 3 }} />
        <div style={{ width: '60%', height: 8, background: 'rgba(26,26,26,0.2)', borderRadius: 3 }} />
      </div>
      <div style={{ flex: 1, background: card, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ width: '80%', height: 4, background: textDark, borderRadius: 2 }} />
        <div style={{ width: '65%', height: 4, background: textLight, borderRadius: 2 }} />
        <div style={{ width: '90%', height: 4, background: textLight, borderRadius: 2 }} />
      </div>
    </div>
  )

  if (id === 'split') return (
    // This preview correctly shows the two-column layout
    <div style={{ ...base, flexDirection: 'row' }}>
      <div style={{ width: '42%', background: 'linear-gradient(160deg,#ffaaaa,#fdd5c0)', flexShrink: 0 }} />
      <div style={{ flex: 1, background: card, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ width: 36, height: 4, background: textDark, borderRadius: 2, marginBottom: 2 }} />
        <div style={{ width: '90%', height: 4, background: textDark, borderRadius: 2 }} />
        <div style={{ width: '75%', height: 4, background: textLight, borderRadius: 2 }} />
        <div style={{ width: '85%', height: 4, background: textLight, borderRadius: 2 }} />
        <div style={{ width: '60%', height: 4, background: textLight, borderRadius: 2 }} />
      </div>
    </div>
  )

  // minimal
  return (
    <div style={base}>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ width: 38, height: 4, background: textLight, borderRadius: 2, marginBottom: 12 }} />
        <div style={{ height: 1, background: line, marginBottom: 10 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ width: '95%', height: 5, background: textDark, borderRadius: 2 }} />
          <div style={{ width: '80%', height: 5, background: textDark, borderRadius: 2 }} />
          <div style={{ width: '88%', height: 5, background: textDark, borderRadius: 2 }} />
          <div style={{ width: '65%', height: 5, background: textLight, borderRadius: 2 }} />
        </div>
      </div>
    </div>
  )
}
