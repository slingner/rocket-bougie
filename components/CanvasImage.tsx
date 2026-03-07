'use client'

import { useRef, useEffect, useCallback } from 'react'

function coverRect(imgW: number, imgH: number, canvasW: number, canvasH: number) {
  const imgRatio = imgW / imgH
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
    canvas.width = w * dpr
    canvas.height = h * dpr

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)

    const { sx, sy, sw, sh } = coverRect(img.naturalWidth, img.naturalHeight, w, h)
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h)
  }, [])

  useEffect(() => {
    let cancelled = false
    const img = new window.Image()
    img.onload = () => {
      if (cancelled) return
      imgRef.current = img
      draw()
    }
    img.src = src
    return () => { cancelled = true }
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
