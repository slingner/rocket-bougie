'use client'

import { useState } from 'react'
import { useCart } from '@/lib/cart'

interface Variant {
  id: string
  option1_name: string | null
  option1_value: string | null
  option2_name: string | null
  option2_value: string | null
  price: number
  compare_at_price: number | null
  inventory_quantity: number
  inventory_policy: string
}

interface VariantSelectorProps {
  variants: Variant[]
  hasVariants: boolean
  productId: string
  handle: string
  title: string
  imageUrl: string | null
  tags: string[]
}

export default function VariantSelector({
  variants,
  hasVariants,
  productId,
  handle,
  title,
  imageUrl,
  tags,
}: VariantSelectorProps) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  // Collect unique option values in order of first appearance
  const opt1Values = [...new Set(variants.map(v => v.option1_value).filter(Boolean))] as string[]
  const opt2Values = [...new Set(variants.map(v => v.option2_value).filter(Boolean))] as string[]

  const opt1Name = variants[0]?.option1_name ?? 'Option'
  const opt2Name = variants[0]?.option2_name ?? null
  const hasOption2 = opt2Values.length > 0 && !!opt2Name

  // Default selections: first size, prefer "Unframed" for option2
  const defaultOpt1 = opt1Values[0] ?? null
  const defaultOpt2 = hasOption2
    ? (opt2Values.includes('Unframed') ? 'Unframed' : opt2Values[0])
    : null

  const [selectedOpt1, setSelectedOpt1] = useState<string | null>(defaultOpt1)
  const [selectedOpt2, setSelectedOpt2] = useState<string | null>(defaultOpt2)

  // Find the variant matching the current selection
  const selected = variants.find(v => {
    const matchOpt1 = v.option1_value === selectedOpt1
    const matchOpt2 = hasOption2 ? v.option2_value === selectedOpt2 : true
    return matchOpt1 && matchOpt2
  }) ?? variants[0]

  const price = Number(selected?.price ?? 0)
  const comparePrice = selected?.compare_at_price ? Number(selected.compare_at_price) : null
  const outOfStock =
    selected?.inventory_policy !== 'continue' &&
    (selected?.inventory_quantity ?? 0) <= 0

  // Check if a given opt1 value is available with the current opt2 selection
  function isOpt1Available(val: string) {
    return variants.some(v => {
      const matchOpt1 = v.option1_value === val
      const matchOpt2 = hasOption2 ? v.option2_value === selectedOpt2 : true
      return matchOpt1 && matchOpt2 &&
        (v.inventory_policy === 'continue' || (v.inventory_quantity ?? 0) > 0)
    })
  }

  // Check if a given opt2 value is available with the current opt1 selection
  function isOpt2Available(val: string) {
    return variants.some(v => {
      return v.option1_value === selectedOpt1 &&
        v.option2_value === val &&
        (v.inventory_policy === 'continue' || (v.inventory_quantity ?? 0) > 0)
    })
  }

  // Build cart variant title: "8x10 / Framed", or just "8x10", or null for default
  const variantTitle = (() => {
    if (!selected || selected.option1_name === 'Title') return null
    const parts = [selected.option1_value, hasOption2 ? selected.option2_value : null]
      .filter(Boolean)
    return parts.length > 0 ? parts.join(' / ') : null
  })()

  function handleAddToCart() {
    if (!selected || outOfStock) return
    addItem({
      variantId: selected.id,
      productId,
      handle,
      title,
      variantTitle,
      price,
      imageUrl,
      tags,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

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

      {/* Option 1 (e.g. Size) */}
      {hasVariants && opt1Values.length > 0 && (
        <OptionGroup
          label={opt1Name}
          values={opt1Values}
          selected={selectedOpt1}
          isAvailable={isOpt1Available}
          onSelect={setSelectedOpt1}
        />
      )}

      {/* Option 2 (e.g. Frame) */}
      {hasVariants && hasOption2 && opt2Name && (
        <OptionGroup
          label={opt2Name}
          values={opt2Values}
          selected={selectedOpt2}
          isAvailable={isOpt2Available}
          onSelect={setSelectedOpt2}
          hint={opt2Values.includes('Framed') ? 'Black wood frame, ready to hang' : undefined}
        />
      )}

      {/* Add to Cart */}
      <button
        onClick={handleAddToCart}
        disabled={outOfStock}
        style={{
          width: '100%',
          padding: '1rem 1.5rem',
          borderRadius: '100px',
          background: outOfStock
            ? 'var(--muted)'
            : added
            ? 'var(--foreground)'
            : 'var(--accent)',
          color: outOfStock || added ? 'var(--background)' : 'var(--foreground)',
          fontSize: '1rem',
          fontWeight: 600,
          letterSpacing: '0.01em',
          border: 'none',
          cursor: outOfStock ? 'not-allowed' : 'pointer',
          opacity: outOfStock ? 0.7 : 1,
          transition: 'background 0.2s, color 0.2s',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {outOfStock ? 'Sold Out' : added ? 'Added!' : 'Add to Cart'}
      </button>
    </div>
  )
}

function OptionGroup({
  label,
  values,
  selected,
  isAvailable,
  onSelect,
  hint,
}: {
  label: string
  values: string[]
  selected: string | null
  isAvailable: (val: string) => boolean
  onSelect: (val: string) => void
  hint?: string
}) {
  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '0.5rem',
          marginBottom: '0.65rem',
        }}
      >
        <p
          style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            opacity: 0.45,
            margin: 0,
          }}
        >
          {label}
        </p>
        {hint && (
          <p style={{ fontSize: '0.75rem', opacity: 0.4, margin: 0 }}>
            {hint}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {values.map((val) => {
          const isSelected = val === selected
          const available = isAvailable(val)
          return (
            <button
              key={val}
              onClick={() => available && onSelect(val)}
              disabled={!available}
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
                cursor: available ? 'pointer' : 'not-allowed',
                opacity: available ? 1 : 0.3,
                transition: 'all 0.15s',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {val}
            </button>
          )
        })}
      </div>
    </div>
  )
}
