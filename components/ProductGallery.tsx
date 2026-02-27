'use client'

import { useState, useRef, useEffect } from 'react'
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
  videoUrl?: string | null
}

export default function ProductGallery({ images, title, videoUrl }: ProductGalleryProps) {
  // Video is item 0 when present; images follow
  const totalItems = (videoUrl ? 1 : 0) + images.length
  const [activeIndex, setActiveIndex] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  const isVideoActive = videoUrl && activeIndex === 0
  const imageIndex = videoUrl ? activeIndex - 1 : activeIndex
  const activeImage = !isVideoActive ? images[imageIndex] : null

  // Autoplay when video tab is selected
  useEffect(() => {
    if (isVideoActive) {
      videoRef.current?.play().catch(() => {})
    } else {
      videoRef.current?.pause()
    }
  }, [isVideoActive])

  return (
    <div>
      {/* Main viewer */}
      <div
        style={{
          background: 'var(--muted)',
          borderRadius: '1rem',
          overflow: 'hidden',
          aspectRatio: '1 / 1',
          position: 'relative',
        }}
      >
        {isVideoActive ? (
          <video
            ref={videoRef}
            src={videoUrl}
            autoPlay
            muted
            loop
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : activeImage ? (
          <Image
            key={activeImage.id}
            src={activeImage.url}
            alt={activeImage.alt_text || title}
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

      {/* Thumbnails — only shown when there is more than one media item */}
      {totalItems > 1 && (
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginTop: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Video thumbnail */}
          {videoUrl && (
            <button
              onClick={() => setActiveIndex(0)}
              aria-label="View video"
              style={{
                width: 72,
                height: 72,
                borderRadius: '0.5rem',
                overflow: 'hidden',
                position: 'relative',
                border: activeIndex === 0
                  ? '2px solid var(--foreground)'
                  : '2px solid transparent',
                cursor: 'pointer',
                padding: 0,
                background: 'var(--muted)',
                flexShrink: 0,
                transition: 'border-color 0.15s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Muted preview frame */}
              <video
                src={videoUrl}
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              {/* Play icon overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.22)',
                }}
              >
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderTop: '7px solid transparent',
                    borderBottom: '7px solid transparent',
                    borderLeft: '12px solid #fff',
                    marginLeft: 3,
                  }}
                />
              </div>
            </button>
          )}

          {/* Image thumbnails */}
          {images.map((img, i) => {
            const thumbIndex = videoUrl ? i + 1 : i
            return (
              <button
                key={img.id}
                onClick={() => setActiveIndex(thumbIndex)}
                aria-label={`View image ${i + 1}`}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  position: 'relative',
                  border: thumbIndex === activeIndex
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
            )
          })}
        </div>
      )}
    </div>
  )
}
