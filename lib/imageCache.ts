// Shared canvas utilities and image loading cache for canvas-rendered images.

// Wraps a URL in Next.js image optimization. Returns WebP/AVIF at the requested
// width, served from Vercel's CDN. Skips wrapping if already optimized.
export function optimizedImageUrl(src: string, width: number, quality = 80): string {
  if (!src || src.startsWith('/_next/')) return src
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`
}


// Calculates the source rect for drawing an image with object-fit: cover behaviour.
export function coverRect(imgW: number, imgH: number, canvasW: number, canvasH: number) {
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

// Loaded images keyed by src URL. Persists across component mounts within the JS session.
const cache = new Map<string, HTMLImageElement>()

// In-flight loads keyed by src URL. Deduplicates concurrent requests for the same image.
const pending = new Map<string, Array<(img: HTMLImageElement) => void>>()

// Loads an image, using the cache if available or deduplicating concurrent requests.
// Returns a cleanup function that cancels the callback (but not the underlying fetch,
// so the result is still cached for other consumers).
export function loadImage(src: string, onLoad: (img: HTMLImageElement) => void): () => void {
  const cached = cache.get(src)
  if (cached) {
    onLoad(cached)
    return () => {}
  }

  const inFlight = pending.get(src)
  if (inFlight) {
    inFlight.push(onLoad)
    return () => {
      const i = inFlight.indexOf(onLoad)
      if (i >= 0) inFlight.splice(i, 1)
    }
  }

  const callbacks = [onLoad]
  pending.set(src, callbacks)

  const img = new window.Image()
  img.onload = () => {
    pending.delete(src)
    cache.set(src, img)
    for (const cb of callbacks) cb(img)
  }
  img.onerror = () => {
    pending.delete(src)
    console.error(`[imageCache] Failed to load: ${src}`)
  }
  img.src = src

  return () => {
    const i = callbacks.indexOf(onLoad)
    if (i >= 0) callbacks.splice(i, 1)
  }
}
