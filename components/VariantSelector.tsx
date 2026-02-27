'use client'

import { useState } from 'react'

interface Variant {
  id: string
  option1_name: string | null
  option1_value: string | null
  price: number
  compare_at_price: number | null
  inventory_quantity: number
  inventory_policy: string
}

interface VariantSelectorProps {
  variants: Variant[]
  hasVariants: boolean
}

export default function VariantSelector({ variants, hasVariants }: VariantSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(variants[0]?.id ?? null)

  const selected = variants.find((v) => v.id === selectedId) ?? variants[0]
  const price = Number(selected?.price ?? 0)
  const comparePrice = selected?.compare_at_price ? Number(selected.compare_at_price) : null
  const outOfStock =
    selected?.inventory_policy !== 'continue' &&
    (selected?.inventory_quantity ?? 0) <= 0

  const optionLabel = variants[0]?.option1_name ?? 'Size'

  return (
    <div>
      {/* Price */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '0.75rem',
          marginBottom: hasVariants ? '1.75rem' : '2rem',
        }}
      >
        <span style={{ fontSize: '1.5rem', fontWeight: 500, letterSpacing: '-0.01em' }}>
          ${price.toFixed(2)}
        </span>
        {comparePrice && comparePrice > price && (
          <span style={{ fontSize: '1rem', opacity: 0.38, textDecoration: 'line-through' }}>
            ${comparePrice.toFixed(2)}
          </span>
        )}
      </div>

      {/* Variant option pills */}
      {hasVariants && (
        <div style={{ marginBottom: '2rem' }}>
          <p
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              opacity: 0.45,
              margin: '0 0 0.65rem',
            }}
          >
            {optionLabel}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {variants.map((v) => {
              const isSelected = v.id === selectedId
              const isSoldOut =
                v.inventory_policy !== 'continue' && v.inventory_quantity <= 0

              return (
                <button
                  key={v.id}
                  onClick={() => !isSoldOut && setSelectedId(v.id)}
                  disabled={isSoldOut}
                  style={{
                    padding: '0.5rem 1.1rem',
                    borderRadius: '100px',
                    border: isSelected
                      ? '1.5px solid var(--foreground)'
                      : '1.5px solid var(--border)',
                    background: isSelected ? 'var(--foreground)' : 'transparent',
                    color: isSelected ? 'var(--background)' : 'var(--foreground)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: isSoldOut ? 'not-allowed' : 'pointer',
                    opacity: isSoldOut ? 0.3 : 1,
                    transition: 'all 0.15s',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {v.option1_value}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Add to Cart */}
      <button
        disabled={outOfStock}
        style={{
          width: '100%',
          padding: '1rem 1.5rem',
          borderRadius: '100px',
          background: outOfStock ? 'var(--muted)' : 'var(--accent)',
          color: 'var(--foreground)',
          fontSize: '1rem',
          fontWeight: 600,
          letterSpacing: '0.01em',
          border: 'none',
          cursor: outOfStock ? 'not-allowed' : 'pointer',
          opacity: outOfStock ? 0.7 : 1,
          transition: 'opacity 0.15s',
          fontFamily: 'var(--font-sans)',
        }}
        className={outOfStock ? '' : 'hover:opacity-80'}
      >
        {outOfStock ? 'Sold Out' : 'Add to Cart'}
      </button>
    </div>
  )
}
