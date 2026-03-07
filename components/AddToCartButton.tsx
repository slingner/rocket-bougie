'use client'

import { useState } from 'react'
import { useCart } from '@/lib/cart'

export interface CardVariant {
  id: string
  price: number
  label: string
}

interface Props {
  handle: string
  productId: string
  title: string
  imageUrl: string | null
  tags: string[]
  variants: CardVariant[]
}

// Flat photo/print icon
function PrintIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="2" width="13" height="12" rx="1.25" />
      <circle cx="5.5" cy="5.75" r="1.25" strokeWidth="1.25" />
      <path d="M1.5 11 L5 8 L7.5 10 L11 7 L14.5 11" />
    </svg>
  )
}

// Picture frame icon — thick outer border + inner image area
function FramedPrintIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <rect x="0.75" y="0.75" width="14.5" height="14.5" rx="1.75" strokeWidth="2.5" />
      <rect x="4" y="4" width="8" height="8" rx="0.75" strokeWidth="1.25" />
    </svg>
  )
}

const glass = {
  background: 'rgba(250, 249, 246, 0.92)',
  color: 'var(--foreground)',
  border: '1px solid rgba(255,255,255,0.35)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  cursor: 'pointer',
  fontWeight: 600 as const,
  letterSpacing: '0.02em',
  lineHeight: 1,
  transition: 'background 0.15s, color 0.15s',
}

const confirmedStyle = {
  background: 'var(--foreground)',
  color: 'var(--background)',
  border: '1px solid transparent',
}

export default function AddToCartButton({ handle, productId, title, imageUrl, tags, variants }: Props) {
  const { addItem } = useCart()
  const [open, setOpen] = useState(false)
  const [addedId, setAddedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [mainHovered, setMainHovered] = useState(false)

  function handleAdd(e: React.MouseEvent, variant: CardVariant) {
    e.preventDefault()
    e.stopPropagation()
    addItem({
      variantId: variant.id,
      productId,
      handle,
      title,
      variantTitle: variant.label || null,
      price: variant.price,
      imageUrl,
      tags,
    })
    setAddedId(variant.id)
    setTimeout(() => {
      setAddedId(null)
      setOpen(false)
    }, 1200)
  }

  const isMulti = variants.length > 1

  return (
    <>
      {/* Variant picker panel — slides up from bottom of image */}
      {isMulti && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 2,
            transform: open ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
            background: 'rgba(250, 249, 246, 0.96)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            padding: '0.625rem 0.625rem 0.75rem',
          }}
        >
          {/* Header row: dismiss button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.375rem' }}>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false) }}
              aria-label="Close"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--foreground)',
                opacity: 0.28,
                padding: '0.1rem 0.25rem',
                lineHeight: 1,
                fontSize: '1rem',
                transition: 'opacity 0.15s',
              }}
            >
              ×
            </button>
          </div>

          {/* Variant rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {variants.map((v) => {
              const isAdded = addedId === v.id
              const isFramed = v.label.includes('Framed')
              const priceStr = v.price % 1 === 0 ? `$${v.price.toFixed(0)}` : `$${v.price.toFixed(2)}`
              return (
                <button
                  key={v.id}
                  onClick={(e) => handleAdd(e, v)}
                  onMouseEnter={() => setHoveredId(v.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    padding: '0.5rem 0.5rem',
                    borderRadius: '0.45rem',
                    cursor: 'pointer',
                    textAlign: 'left' as const,
                    transition: 'background 0.12s, border-color 0.12s',
                    ...(isAdded
                      ? { ...confirmedStyle, border: '1px solid transparent' }
                      : hoveredId === v.id
                      ? { background: 'rgba(26,26,26,0.09)', border: '1px solid rgba(26,26,26,0.12)', color: 'var(--foreground)' }
                      : { background: 'transparent', border: '1px solid rgba(26,26,26,0.07)', color: 'var(--foreground)' }
                    ),
                  }}
                >
                  {/* Icon */}
                  <span style={{ opacity: isAdded ? 0.7 : 0.4, flexShrink: 0 }}>
                    {isFramed ? <FramedPrintIcon /> : <PrintIcon />}
                  </span>

                  {/* Label */}
                  <span style={{ flex: 1, fontSize: '0.775rem', fontWeight: 500, letterSpacing: '0.01em' }}>
                    {isAdded ? '✓ Added' : v.label}
                  </span>

                  {/* Price */}
                  {!isAdded && (
                    <span style={{ fontSize: '0.72rem', opacity: 0.45, fontWeight: 400, flexShrink: 0 }}>
                      {priceStr}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* "Add to cart" button — revealed on card hover, hidden when panel is open */}
      <div
        className="opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 ease-out"
        style={{
          position: 'absolute',
          bottom: '0.625rem',
          left: '0.625rem',
          right: '0.625rem',
          zIndex: 1,
          ...(open ? { opacity: 0, pointerEvents: 'none' as const } : {}),
        }}
      >
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (isMulti) {
              setOpen(true)
            } else {
              handleAdd(e, variants[0])
            }
          }}
          onMouseEnter={() => setMainHovered(true)}
          onMouseLeave={() => setMainHovered(false)}
          style={{
            ...glass,
            ...(!isMulti && addedId
              ? confirmedStyle
              : mainHovered
              ? { background: 'rgba(26,26,26,0.09)', border: '1px solid rgba(26,26,26,0.12)' }
              : {}),
            width: '100%',
            padding: '0.55rem 0.875rem',
            borderRadius: '0.625rem',
            fontSize: '0.775rem',
            textAlign: 'center' as const,
          }}
        >
          {!isMulti && addedId ? 'Added!' : 'Add to cart'}
        </button>
      </div>
    </>
  )
}
