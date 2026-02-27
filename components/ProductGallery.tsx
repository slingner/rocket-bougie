'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ProductImage {
  id: string
  url: string
  alt_text: string | null
  position: number
}

interface ProductGalleryProps {
  images: ProductImage[]
  title: string
}

export default function ProductGallery({ images, title }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = images[activeIndex]

  return (
    <div>
      {/* Main image */}
      <div
        style={{
          background: 'var(--muted)',
          borderRadius: '1rem',
          overflow: 'hidden',
          aspectRatio: '1 / 1',
          position: 'relative',
        }}
      >
        {active ? (
          <Image
            key={active.id}
            src={active.url}
            alt={active.alt_text || title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: 'cover' }}
            priority
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.2,
              fontSize: '4rem',
            }}
          >
            🚀
          </div>
        )}
      </div>

      {/* Thumbnails — only shown when there are multiple images */}
      {images.length > 1 && (
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginTop: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(i)}
              aria-label={`View image ${i + 1}`}
              style={{
                width: 72,
                height: 72,
                borderRadius: '0.5rem',
                overflow: 'hidden',
                position: 'relative',
                border: i === activeIndex
                  ? '2px solid var(--foreground)'
                  : '2px solid transparent',
                cursor: 'pointer',
                padding: 0,
                background: 'var(--muted)',
                flexShrink: 0,
                transition: 'border-color 0.15s',
              }}
            >
              <Image
                src={img.url}
                alt={img.alt_text || `${title} — image ${i + 1}`}
                fill
                sizes="72px"
                style={{ objectFit: 'cover' }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
