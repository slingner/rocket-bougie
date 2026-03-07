'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import CanvasImage from './CanvasImage'

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

const LOUPE_R = 115
const ZOOM    = 3.2

// Calculates the source rect for drawing an image with object-fit: cover behaviour.
function coverRect(imgW: number, imgH: number, canvasW: number, canvasH: number) {
  const imgRatio    = imgW / imgH
  const canvasRatio = canvasW / canvasH
  let sx = 0, sy = 0, sw = imgW, sh = imgH
  if (imgRatio > canvasRatio) {
    sw = imgH * canvasRatio
    sx = (imgW - sw) / 2
  } else {
    sh = imgW / canvasRatio
    sy = (imgH - sh) / 2
  }
  return { sx, sy, sw, sh }
}

export default function ProductGallery({ images, title, videoUrl }: ProductGalleryProps) {
  const totalItems = (videoUrl ? 1 : 0) + images.length
  const [activeIndex, setActiveIndex] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Canvas refs
  const artRef        = useRef<HTMLDivElement>(null)
  const canvasRef     = useRef<HTMLCanvasElement>(null)
  const imgRef        = useRef<HTMLImageElement | null>(null)
  const loupeCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // Loupe mouse tracking
  const rafRef  = useRef<number | null>(null)
  const rectRef = useRef<DOMRect | null>(null)
  const [loupe, setLoupe] = useState<{
    client: { x: number; y: number }
    local:  { x: number; y: number }
    w: number; h: number
  } | null>(null)

  const isVideoActive = videoUrl && activeIndex === 0
  const imageIndex    = videoUrl ? activeIndex - 1 : activeIndex
  const activeImage   = !isVideoActive ? images[imageIndex] : null

  // Draws the current image onto the main canvas with cover-fit and DPR sharpness.
  // Only uses refs so it's safe to call from ResizeObserver and image onload.
  const drawMainCanvas = useCallback(() => {
    const canvas    = canvasRef.current
    const img       = imgRef.current
    const container = artRef.current
    if (!canvas || !img || !container) return

    const dpr = window.devicePixelRatio || 1
    const w   = container.clientWidth
    const h   = container.clientHeight
    canvas.width  = w * dpr
    canvas.height = h * dpr

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)

    const { sx, sy, sw, sh } = coverRect(img.naturalWidth, img.naturalHeight, w, h)
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h)
  }, [])

  // Load image into canvas whenever the active image changes.
  // crossOrigin is intentionally NOT set — this taints the canvas and blocks toDataURL().
  useEffect(() => {
    const canvas = canvasRef.current
    if (!activeImage) {
      imgRef.current = null
      if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
      return
    }

    let cancelled = false
    const img = new window.Image()
    img.onload = () => {
      if (cancelled) return
      imgRef.current = img
      drawMainCanvas()
    }
    img.src = activeImage.url

    return () => { cancelled = true }
  }, [activeImage, drawMainCanvas])

  // Redraw on container resize (e.g. window resize, layout shift).
  useEffect(() => {
    const container = artRef.current
    if (!container) return
    const ro = new ResizeObserver(() => drawMainCanvas())
    ro.observe(container)
    return () => ro.disconnect()
  }, [drawMainCanvas])

  // Clear loupe when switching to a different image or video.
  useEffect(() => { setLoupe(null) }, [activeIndex])

  // Video autoplay/pause.
  useEffect(() => {
    if (isVideoActive) {
      videoRef.current?.play().catch(() => {})
    } else {
      videoRef.current?.pause()
    }
  }, [isVideoActive])

  // Draw the zoomed view onto the loupe canvas whenever the cursor moves.
  useEffect(() => {
    const canvas = loupeCanvasRef.current
    const img    = imgRef.current
    if (!canvas || !img || !loupe) return

    const size = LOUPE_R * 2
    canvas.width  = size
    canvas.height = size

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { sx, sy, sw, sh } = coverRect(img.naturalWidth, img.naturalHeight, loupe.w, loupe.h)

    ctx.clearRect(0, 0, size, size)
    ctx.save()
    ctx.scale(ZOOM, ZOOM)
    ctx.translate(LOUPE_R / ZOOM - loupe.local.x, LOUPE_R / ZOOM - loupe.local.y)
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, loupe.w, loupe.h)
    ctx.restore()
  }, [loupe])

  function handleArtMouseEnter() {
    rectRef.current = artRef.current?.getBoundingClientRect() ?? null
  }

  function handleArtMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (rafRef.current !== null) return
    const clientX = e.clientX
    const clientY = e.clientY
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const rect = rectRef.current
      if (!rect) return
      setLoupe({
        client: { x: clientX, y: clientY },
        local:  { x: clientX - rect.left, y: clientY - rect.top },
        w: rect.width, h: rect.height,
      })
    })
  }

  function handleArtMouseLeave() {
    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    rectRef.current = null
    setLoupe(null)
  }

  return (
    <div>
      {/* Main viewer */}
      <div
        ref={artRef}
        onContextMenu={(e) => e.preventDefault()}
        onMouseEnter={activeImage ? handleArtMouseEnter : undefined}
        onMouseMove={activeImage ? handleArtMouseMove : undefined}
        onMouseLeave={activeImage ? handleArtMouseLeave : undefined}
        style={{
          background: 'var(--muted)',
          borderRadius: '1rem',
          overflow: 'hidden',
          aspectRatio: '1 / 1',
          position: 'relative',
          cursor: loupe ? 'none' : 'default',
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
          <canvas
            ref={canvasRef}
            style={{ display: 'block', width: '100%', height: '100%' }}
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

      {/* Loupe overlay — canvas-rendered, no <img> in the DOM */}
      {loupe && activeImage && (
        <div style={{
          position: 'fixed',
          left: loupe.client.x - LOUPE_R,
          top:  loupe.client.y - LOUPE_R,
          width:  LOUPE_R * 2,
          height: LOUPE_R * 2,
          borderRadius: '50%',
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 9999,
          boxShadow: [
            'inset 0 0 0 1.5px rgba(255,255,255,0.55)',
            '0 0 0 1px rgba(0,0,0,0.22)',
            '0 0 0 3px rgba(0,0,0,0.10)',
            '0 12px 48px rgba(0,0,0,0.40)',
            '0 4px 16px rgba(0,0,0,0.28)',
          ].join(', '),
        }}>
          <canvas
            ref={loupeCanvasRef}
            style={{ display: 'block', width: '100%', height: '100%' }}
          />
          {/* Glass sheen */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 32% 22%, rgba(255,255,255,0.16) 0%, transparent 58%)',
          }} />
        </div>
      )}

      {/* Thumbnails */}
      {totalItems > 1 && (
        <div
          onContextMenu={(e) => e.preventDefault()}
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginTop: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
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
              <video
                src={videoUrl}
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
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
                <div style={{
                  width: 0,
                  height: 0,
                  borderTop: '7px solid transparent',
                  borderBottom: '7px solid transparent',
                  borderLeft: '12px solid #fff',
                  marginLeft: 3,
                }} />
              </div>
            </button>
          )}

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
                <CanvasImage src={img.url} />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
