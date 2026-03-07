'use client'

import { useState, useRef, useTransition } from 'react'
import { uploadProductImage, reorderImages } from '@/app/admin/actions'

type Image = {
  id: string
  url: string
  position: number
  alt_text?: string | null
  synced_to_faire?: boolean
  faire_image_id?: string | null
}

export default function ImageUploader({
  productId,
  images,
  onImagesChange,
}: {
  productId: string
  images: Image[]
  onImagesChange: (images: Image[]) => void
}) {
  const [isFileDragging, setIsFileDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [, startTransition] = useTransition()

  // Drag-to-reorder state
  const dragIndexRef = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // ── File upload ──────────────────────────────────────────────────────────────

  async function handleFiles(files: FileList | File[]) {
    const fileArray = Array.from(files)
    const imageFiles = fileArray.filter(f => f.type.startsWith('image/'))
    if (imageFiles.length === 0) return

    setUploading(true)
    setError(null)

    for (const file of imageFiles) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        const url = await uploadProductImage(productId, formData)
        const newImage: Image = {
          id: crypto.randomUUID(),
          url,
          position: images.length + 1,
        }
        onImagesChange([...images, newImage])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Upload failed')
        break
      }
    }
    setUploading(false)
  }

  // Only treat it as a file drop if there are actual files (not an internal image drag)
  function handleZoneDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsFileDragging(false)
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  function handleZoneDragOver(e: React.DragEvent) {
    e.preventDefault()
    // Only show drop highlight if it looks like external files (not an image card drag)
    if (dragIndexRef.current === null) {
      setIsFileDragging(true)
    }
  }

  function handleRemove(img: Image) {
    startTransition(async () => {
      const { deleteImage } = await import('@/app/admin/actions')
      await deleteImage(img.id, productId)
    })
    onImagesChange(images.filter(i => i.id !== img.id))
  }

  // ── Drag-to-reorder ───────────────────────────────────────────────────────────

  function handleImageDragStart(e: React.DragEvent, index: number) {
    dragIndexRef.current = index
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }

  function handleImageDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  function handleImageDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault()
    e.stopPropagation()
    setDragOverIndex(null)

    const srcIndex = dragIndexRef.current
    dragIndexRef.current = null
    if (srcIndex === null || srcIndex === dropIndex) return

    const reordered = [...images]
    const [moved] = reordered.splice(srcIndex, 1)
    reordered.splice(dropIndex, 0, moved)

    const withPositions = reordered.map((img, i) => ({ ...img, position: i + 1 }))
    onImagesChange(withPositions)

    startTransition(async () => {
      await reorderImages(productId, withPositions.map(img => img.id))
    })
  }

  function handleImageDragEnd() {
    dragIndexRef.current = null
    setDragOverIndex(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Image grid */}
      {images.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {images.map((img, index) => {
            const isDragOver = dragOverIndex === index && dragIndexRef.current !== index

            return (
              <div
                key={img.id}
                draggable
                onDragStart={e => handleImageDragStart(e, index)}
                onDragOver={e => handleImageDragOver(e, index)}
                onDrop={e => handleImageDrop(e, index)}
                onDragEnd={handleImageDragEnd}
                style={{
                  position: 'relative',
                  cursor: 'grab',
                  outline: isDragOver ? '2px solid var(--foreground)' : '2px solid transparent',
                  borderRadius: '0.5rem',
                  transition: 'outline 0.1s, opacity 0.1s',
                  opacity: dragIndexRef.current === index ? 0.4 : 1,
                }}
              >
                {/* Position badge */}
                {index === 0 && (
                  <div style={{
                    position: 'absolute',
                    top: 4,
                    left: 4,
                    background: 'var(--foreground)',
                    color: 'var(--background)',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.35rem',
                    borderRadius: '0.25rem',
                    zIndex: 1,
                    letterSpacing: '0.04em',
                  }}>
                    MAIN
                  </div>
                )}

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.alt_text ?? ''}
                  draggable={false}
                  style={{
                    width: 88,
                    height: 88,
                    objectFit: 'cover',
                    borderRadius: '0.5rem',
                    background: 'var(--border)',
                    display: 'block',
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                />

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemove(img)}
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#991b1b',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    zIndex: 2,
                  }}
                >
                  ×
                </button>

                {/* Faire sync dot */}
                <div
                  title={img.synced_to_faire ? 'Synced to Faire' : 'Not synced to Faire'}
                  style={{
                    position: 'absolute',
                    bottom: 4,
                    left: 4,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: img.synced_to_faire ? '#166534' : '#92400e',
                    color: '#fff',
                    fontSize: '0.55rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  F
                </div>
              </div>
            )
          })}
        </div>
      )}

      {images.length > 1 && (
        <p style={{ fontSize: '0.75rem', opacity: 0.4, margin: 0 }}>
          Drag images to reorder. First image is the main product photo.
        </p>
      )}

      {/* Upload drop zone */}
      <div
        onDragOver={handleZoneDragOver}
        onDragLeave={() => setIsFileDragging(false)}
        onDrop={handleZoneDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isFileDragging ? 'var(--foreground)' : 'var(--border)'}`,
          borderRadius: '0.625rem',
          padding: '1.75rem 1rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: isFileDragging ? 'color-mix(in srgb, var(--foreground) 4%, transparent)' : 'transparent',
          transition: 'all 0.15s',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />
        <p style={{ margin: 0, fontSize: '0.875rem', opacity: uploading ? 0.4 : 0.6 }}>
          {uploading
            ? 'Uploading…'
            : isFileDragging
            ? 'Drop to upload'
            : 'Drag images here, or click to browse'}
        </p>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', opacity: 0.35 }}>
          JPG, PNG, WebP, GIF
        </p>
      </div>

      {error && (
        <p style={{ fontSize: '0.8rem', color: '#991b1b', margin: 0 }}>
          Upload error: {error}
        </p>
      )}
    </div>
  )
}
