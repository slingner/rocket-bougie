'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { type CardVariant } from './AddToCartButton'
import QuickViewModal from './QuickViewModal'

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
  const [quickViewOpen, setQuickViewOpen] = useState(false)

  const imgScale = tags.includes('sticker') && !tags.includes('sticker-pack')
    ? 0.7
    : tags.includes('print') && !tags.includes('mini-print')
    ? 1.12
    : 1

  return (
    <div className="group" style={{ color: 'var(--foreground)' }}>

      <div
        onContextMenu={(e) => e.preventDefault()}
        style={{
          position: 'relative',
          borderRadius: '0.75rem',
          overflow: 'hidden',
          aspectRatio: '1 / 1',
          background: tags.includes('sticker') && !tags.includes('sticker-pack') ? '#ffffff' : 'var(--muted)',
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
            unoptimized // TEMP: remove once Vercel image quota resets — check vercel.com/dashboard/usage
            priority={priority}
            className="group-hover:scale-105"
            style={{ objectFit: 'cover', transition: 'transform 0.4s ease', transform: `scale(${imgScale})` }}
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

        {/* Quick View button — revealed on hover */}
        {variants.length > 0 && (
          <div
            className="hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 2,
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: '0.75rem',
              pointerEvents: 'none',
            }}
          >
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setQuickViewOpen(true)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '0.625rem',
                pointerEvents: 'auto',
                border: '1px solid rgba(255,255,255,0.4)',
                background: 'rgba(250, 249, 246, 0.9)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                color: 'var(--foreground)',
                fontSize: '0.72rem',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'background 0.15s, transform 0.15s',
                boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(250, 249, 246, 1)'
                e.currentTarget.style.transform = 'scale(1.03)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(250, 249, 246, 0.9)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <EyeIcon />
              Quick view
            </button>
          </div>
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

      <QuickViewModal
        isOpen={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
        handle={handle}
        title={title}
        price={price}
        imageUrl={imageUrl}
        imageAlt={imageAlt}
        productId={productId}
        variants={variants}
        tags={tags}
      />
    </div>
  )
}

function EyeIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="8" cy="8" rx="7" ry="4.5" />
      <circle cx="8" cy="8" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}
