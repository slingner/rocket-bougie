'use client'

import { useRef, useEffect, useCallback } from 'react'
import { loadImage, coverRect } from '@/lib/imageCache'

interface CanvasImageProps {
  src: string
  className?: string
  style?: React.CSSProperties
}

// Renders an image onto a canvas with cover-fit and DPR sharpness.
// crossOrigin is intentionally NOT set — setting it taints the canvas and blocks toDataURL().
export default function CanvasImage({ src, className, style }: CanvasImageProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    const wrapper = wrapperRef.current
    if (!canvas || !img || !wrapper) return

    const dpr = window.devicePixelRatio || 1
    const w = wrapper.clientWidth
    const h = wrapper.clientHeight
    if (w === 0 || h === 0) return
    canvas.width = w * dpr
    canvas.height = h * dpr

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)

    const { sx, sy, sw, sh } = coverRect(img.naturalWidth, img.naturalHeight, w, h)
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h)
  }, [])

  useEffect(() => {
    return loadImage(src, (img) => {
      imgRef.current = img
      draw()
    })
  }, [src, draw])

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const ro = new ResizeObserver(() => draw())
    ro.observe(wrapper)
    return () => ro.disconnect()
  }, [draw])

  return (
    <div
      ref={wrapperRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', userSelect: 'none', ...style }}
      className={className}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  )
}
