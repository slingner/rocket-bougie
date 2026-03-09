'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { useCart } from '@/lib/cart'
import { createClient } from '@/lib/supabase/client'
import { type CardVariant } from './AddToCartButton'

interface ProductImage {
  id: string
  url: string
  alt_text: string | null
  position: number
}

interface QuickViewModalProps {
  isOpen: boolean
  onClose: () => void
  handle: string
  title: string
  price: number
  imageUrl: string | null
  imageAlt: string | null
  productId: string
  variants: CardVariant[]
  tags: string[]
}

export default function QuickViewModal({
  isOpen,
  onClose,
  handle,
  title,
  price,
  imageUrl,
  imageAlt,
  productId,
  variants,
  tags,
}: QuickViewModalProps) {
  const { addItem } = useCart()
  const [selectedVariant, setSelectedVariant] = useState<CardVariant | null>(null)
  const [addedId, setAddedId] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Full image + variant image data, fetched lazily
  const [allImages, setAllImages] = useState<ProductImage[]>([])
  const [variantImageMap, setVariantImageMap] = useState<Record<string, string>>({})
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(imageUrl)

  useEffect(() => { setMounted(true) }, [])

  // Fetch full image set once per product
  const fetchedRef = useRef<string | null>(null)
  useEffect(() => {
    if (!isOpen || fetchedRef.current === productId) return
    fetchedRef.current = productId

    const supabase = createClient()
    supabase
      .from('products')
      .select(`
        product_images!product_images_product_id_fkey (id, url, alt_text, position),
        product_variants (id, image_id)
      `)
      .eq('id', productId)
      .single()
      .then(({ data }) => {
        if (!data) return
        const imgs = ([...(data.product_images ?? [])] as ProductImage[])
          .sort((a, b) => a.position - b.position)
        setAllImages(imgs)

        // Build map: variantId → imageUrl
        const imgById = new Map(imgs.map(i => [i.id, i.url]))
        const map: Record<string, string> = {}
        for (const v of (data.product_variants ?? []) as { id: string; image_id: string | null }[]) {
          if (v.image_id && imgById.has(v.image_id)) {
            map[v.id] = imgById.get(v.image_id)!
          }
        }
        setVariantImageMap(map)
      })
  }, [isOpen, productId])

  // Open/close animation + scroll lock
  useEffect(() => {
    if (isOpen) {
      setSelectedVariant(variants[0] ?? null)
      setActiveImageUrl(imageUrl)
      setAddedId(null)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
      document.body.style.overflow = 'hidden'
    } else {
      setVisible(false)
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen, variants, imageUrl])

  // Escape key
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 260)
  }

  function handleSelectVariant(v: CardVariant) {
    setSelectedVariant(v)
    // Switch main image if this variant has one
    if (variantImageMap[v.id]) {
      setActiveImageUrl(variantImageMap[v.id])
    }
  }

  function handleAdd() {
    const variant = selectedVariant ?? variants[0]
    if (!variant) return
    addItem({
      variantId: variant.id,
      productId,
      handle,
      title,
      variantTitle: variant.label !== 'Default Title' ? variant.label : null,
      price: variant.price,
      imageUrl: activeImageUrl ?? imageUrl,
      tags,
    })
    setAddedId(variant.id)
    setTimeout(() => {
      setAddedId(null)
      handleClose()
    }, 1200)
  }

  const isMulti = variants.length > 1
  const displayPrice = selectedVariant ? selectedVariant.price : price
  const priceStr = displayPrice % 1 === 0 ? `$${displayPrice.toFixed(0)}` : `$${displayPrice.toFixed(2)}`
  const canAdd = !isMulti || selectedVariant !== null
  const isAdded = addedId !== null
  const displayImageUrl = activeImageUrl ?? imageUrl
  const thumbnails = allImages.length > 1 ? allImages : []

  if (!mounted || !isOpen) return null

  return createPortal(
    <div
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        background: visible ? 'rgba(10, 10, 8, 0.48)' : 'rgba(10, 10, 8, 0)',
        backdropFilter: visible ? 'blur(6px)' : 'blur(0px)',
        WebkitBackdropFilter: visible ? 'blur(6px)' : 'blur(0px)',
        transition: 'background 0.26s ease, backdrop-filter 0.26s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--background)',
          borderRadius: '0.625rem',
          overflow: 'hidden',
          width: '100%',
          maxWidth: '820px',
          height: 'min(80vh, 620px)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          boxShadow: '0 32px 80px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.1)',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.97)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.26s ease',
          position: 'relative',
        }}
      >
        {/* Close button — top-right corner, clear of border radius */}
        <button
          onClick={handleClose}
          aria-label="Close quick view"
          style={{
            position: 'absolute',
            top: '0.875rem',
            right: '0.875rem',
            zIndex: 10,
            background: 'rgba(250, 249, 246, 0.9)',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: '50%',
            width: '2rem',
            height: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--foreground)',
            fontSize: '1rem',
            lineHeight: 0,
            paddingBottom: '1px',
            backdropFilter: 'blur(8px)',
            transition: 'background 0.15s, opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(250, 249, 246, 1)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(250, 249, 246, 0.9)')}
        >
          ×
        </button>

        {/* Left — main image + thumbnails */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--muted)', minHeight: 0 }}>
          {/* Main image */}
          <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
            {displayImageUrl ? (
              <Image
                key={displayImageUrl}
                src={displayImageUrl}
                alt={imageAlt ?? title}
                fill
                unoptimized // TEMP: remove once Vercel image quota resets
                priority
                sizes="(max-width: 820px) 50vw, 410px"
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '3rem', opacity: 0.2,
              }}>
                🚀
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {thumbnails.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                padding: '0.625rem',
                overflowX: 'auto',
                background: 'var(--background)',
                borderTop: '1px solid var(--border)',
                scrollbarWidth: 'none',
                flexShrink: 0,
              }}
            >
              {thumbnails.map((img) => {
                const isActive = displayImageUrl === img.url
                return (
                  <button
                    key={img.id}
                    onClick={() => setActiveImageUrl(img.url)}
                    style={{
                      position: 'relative',
                      width: 52,
                      height: 52,
                      borderRadius: '0.375rem',
                      overflow: 'hidden',
                      flexShrink: 0,
                      border: isActive
                        ? '2px solid var(--foreground)'
                        : '2px solid transparent',
                      cursor: 'pointer',
                      padding: 0,
                      background: 'var(--muted)',
                      transition: 'border-color 0.12s',
                      opacity: isActive ? 1 : 0.55,
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.opacity = '0.85' }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.opacity = '0.55' }}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt_text ?? title}
                      fill
                      unoptimized // TEMP: remove once Vercel image quota resets
                      sizes="52px"
                      style={{ objectFit: 'cover' }}
                    />
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Right — product info */}
        <div
          style={{
            padding: '2rem 1.875rem 1.875rem',
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}
        >
          {/* Title */}
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.15rem, 2.2vw, 1.5rem)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              lineHeight: 1.25,
              margin: '0 0 0.5rem',
              color: 'var(--foreground)',
              paddingRight: '2rem', // don't overlap close button
            }}
          >
            {title}
          </h2>

          {/* Price */}
          <p
            style={{
              fontSize: '1.05rem',
              fontWeight: 500,
              letterSpacing: '-0.01em',
              margin: '0 0 1.75rem',
              color: 'var(--foreground)',
              opacity: 0.8,
            }}
          >
            {isMulti && !selectedVariant ? `From ${priceStr}` : priceStr}
          </p>

          {/* Variant picker */}
          {isMulti && (
            <div style={{ marginBottom: '1.75rem' }}>
              <p style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                opacity: 0.38,
                margin: '0 0 0.6rem',
              }}>
                {variants[0]?.label.match(/\d+x\d+|^\d+×\d+/) ? 'Size' : 'Option'}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id
                  const vPrice = v.price % 1 === 0 ? `$${v.price.toFixed(0)}` : `$${v.price.toFixed(2)}`
                  return (
                    <button
                      key={v.id}
                      onClick={() => handleSelectVariant(v)}
                      style={{
                        padding: '0.45rem 0.875rem',
                        borderRadius: '0.625rem',
                        fontSize: '0.8rem',
                        fontWeight: isSelected ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        border: isSelected
                          ? '1.5px solid var(--foreground)'
                          : '1.5px solid rgba(0,0,0,0.15)',
                        background: isSelected ? 'var(--foreground)' : 'transparent',
                        color: isSelected ? 'var(--background)' : 'var(--foreground)',
                        letterSpacing: '0.01em',
                      }}
                    >
                      {v.label}
                      <span style={{
                        marginLeft: '0.375rem',
                        opacity: isSelected ? 0.6 : 0.4,
                        fontSize: '0.72rem',
                      }}>
                        {vPrice}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Add to cart */}
          <button
            onClick={handleAdd}
            disabled={!canAdd}
            style={{
              width: '100%',
              padding: '0.8rem 1rem',
              borderRadius: '0.625rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              cursor: canAdd ? 'pointer' : 'not-allowed',
              border: 'none',
              transition: 'background 0.2s, opacity 0.2s',
              background: isAdded
                ? 'var(--foreground)'
                : canAdd
                ? 'var(--accent)'
                : 'var(--muted)',
              color: isAdded
                ? 'var(--background)'
                : canAdd
                ? 'var(--foreground)'
                : 'rgba(0,0,0,0.3)',
              filter: isAdded || !canAdd ? 'none' : 'brightness(0.82)',
              marginBottom: '0.625rem',
            }}
          >
            {isAdded
              ? '✓ Added to cart'
              : isMulti && !selectedVariant
              ? 'Select an option'
              : 'Add to cart'}
          </button>

          {/* View full details */}
          <Link
            href={`/products/${handle}`}
            onClick={handleClose}
            style={{
              display: 'block',
              width: '100%',
              padding: '0.7rem 1rem',
              borderRadius: '0.625rem',
              fontSize: '0.78rem',
              fontWeight: 500,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              textAlign: 'center',
              textDecoration: 'none',
              border: '1.5px solid rgba(0,0,0,0.12)',
              color: 'var(--foreground)',
              transition: 'border-color 0.15s, opacity 0.15s',
              opacity: 0.55,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.opacity = '1'
              e.currentTarget.style.borderColor = 'rgba(0,0,0,0.3)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.opacity = '0.55'
              e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'
            }}
          >
            View full details
          </Link>
        </div>
      </div>
    </div>,
    document.body
  )
}
