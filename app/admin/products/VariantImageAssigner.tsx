'use client'

import { useState, useTransition } from 'react'
import { updateVariantImageId } from '../actions'

type Variant = {
  id: string
  option1_name: string | null
  option1_value: string | null
  option2_name: string | null
  option2_value: string | null
  image_id: string | null
}

type Image = {
  id: string
  url: string
  alt_text: string | null
  position: number
}

function variantLabel(v: Variant) {
  if (!v.option1_name || v.option1_name === 'Title') return 'Default'
  return [v.option1_value, v.option2_value].filter(Boolean).join(' / ')
}

export default function VariantImageAssigner({
  variants,
  images,
}: {
  variants: Variant[]
  images: Image[]
}) {
  const realVariants = variants.filter(v => v.option1_name !== 'Title')
  if (realVariants.length === 0 || images.length === 0) return null

  const [assignments, setAssignments] = useState<Record<string, string | null>>(
    () => Object.fromEntries(realVariants.map(v => [v.id, v.image_id]))
  )
  const [isPending, startTransition] = useTransition()
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  function assign(variantId: string, imageId: string | null) {
    const next = imageId === assignments[variantId] ? null : imageId
    setAssignments(prev => ({ ...prev, [variantId]: next }))
    setLastSaved(variantId)
    startTransition(async () => {
      await updateVariantImageId(variantId, next)
    })
  }

  return (
    <section style={{
      background: 'var(--muted)',
      borderRadius: '0.875rem',
      padding: '1.25rem 1.5rem',
    }}>
      <h2 style={{
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        opacity: 0.4,
        margin: '0 0 1rem',
      }}>
        Variant Photos
      </h2>

      <p style={{ fontSize: '0.8rem', opacity: 0.5, margin: '0 0 1.25rem', lineHeight: 1.5 }}>
        Click a photo to link it to a variant. Selecting it again removes the link.
        When a customer picks that variant, the gallery will jump to that photo.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {realVariants.map(v => {
          const assigned = assignments[v.id]
          const saving = isPending && lastSaved === v.id
          return (
            <div key={v.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.82rem', fontWeight: 500, margin: 0 }}>{variantLabel(v)}</p>
                <p style={{ fontSize: '0.72rem', opacity: saving ? 0.7 : 0.35, margin: '0.2rem 0 0', transition: 'opacity 0.2s' }}>
                  {saving ? 'Saving…' : assigned ? 'Photo linked' : 'No photo'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                {images.map(img => {
                  const isSelected = assigned === img.id
                  return (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => assign(v.id, img.id)}
                      title={img.alt_text ?? `Photo ${img.position}`}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '0.4rem',
                        overflow: 'hidden',
                        border: isSelected
                          ? '2.5px solid var(--accent)'
                          : '2px solid var(--border)',
                        padding: 0,
                        cursor: 'pointer',
                        flexShrink: 0,
                        background: 'var(--background)',
                        outline: isSelected ? '1px solid var(--accent)' : 'none',
                        transition: 'border-color 0.15s, outline 0.15s',
                        opacity: isPending && lastSaved === v.id ? 0.6 : 1,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
