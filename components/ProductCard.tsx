'use client'

import Link from 'next/link'
import Image from 'next/image'
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
  priority?: boolean
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
  priority = false,
}: ProductCardProps) {
  const href = `/products/${handle}`

  return (
    <div className="group" style={{ color: 'var(--foreground)' }}>

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
          style={{ position: 'absolute', inset: 0, display: 'block', zIndex: 1 }}
          tabIndex={-1}
          aria-hidden
          onFocus={(e) => e.currentTarget.blur()}
        />

        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt ?? title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            className="group-hover:scale-105"
            style={{ objectFit: 'cover', transition: 'transform 0.4s ease' }}
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
