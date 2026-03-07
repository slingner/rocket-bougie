'use client'

import Link from 'next/link'
import CanvasImage from './CanvasImage'
import AddToCartButton, { type CardVariant } from './AddToCartButton'

interface ProductCardProps {
  handle: string
  title: string
  price: number
  imageUrl: string | null
  imageAlt: string | null
  productId: string
  variants: CardVariant[]
  tags: string[]
}

export default function ProductCard({
  handle,
  title,
  price,
  imageUrl,
  imageAlt,
  productId,
  variants,
  tags,
}: ProductCardProps) {
  const href = `/products/${handle}`

  return (
    <div className="group" style={{ color: 'var(--foreground)' }}>

      {/*
        overflow:hidden + border-radius live here so the slide-up panel
        is clipped inside the rounded image area as it animates.
        The Link uses position:absolute to cover the full area for navigation.
      */}
      <div
        onContextMenu={(e) => e.preventDefault()}
        style={{
          position: 'relative',
          borderRadius: '0.75rem',
          overflow: 'hidden',
          aspectRatio: '1 / 1',
          background: 'var(--muted)',
        }}
      >
        <Link
          href={href}
          className="no-underline"
          style={{ position: 'absolute', inset: 0, display: 'block' }}
          tabIndex={-1}
          aria-hidden
          onFocus={(e) => e.currentTarget.blur()}
        />

        {imageUrl ? (
          <CanvasImage
            src={imageUrl}
            className="group-hover:scale-105"
            style={{ transition: 'transform 0.4s ease' }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.3,
              fontSize: '2rem',
              pointerEvents: 'none',
            }}
          >
            🚀
          </div>
        )}

        {variants.length > 0 && (
          <AddToCartButton
            handle={handle}
            productId={productId}
            title={title}
            imageUrl={imageUrl}
            tags={tags}
            variants={variants}
          />
        )}
      </div>

      {/* Info */}
      <Link
        href={href}
        className="no-underline block"
        style={{ color: 'var(--foreground)', marginTop: '0.75rem' }}
      >
        <p
          style={{ fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.3, margin: 0 }}
          className="group-hover:opacity-70 transition-opacity"
        >
          {title}
        </p>
        <p style={{ fontSize: '0.875rem', opacity: 0.6, margin: '0.2rem 0 0' }}>
          {variants.length > 1 ? `From $${price.toFixed(2)}` : `$${price.toFixed(2)}`}
        </p>
      </Link>
    </div>
  )
}
