'use client'

import { useState, useRef, useTransition } from 'react'
import { uploadProductImage } from '@/app/admin/actions'

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
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [, startTransition] = useTransition()

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
        // Optimistic: add to local list
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

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  function handleRemove(img: Image) {
    startTransition(async () => {
      const { deleteImage } = await import('@/app/admin/actions')
      await deleteImage(img.id, productId)
    })
    onImagesChange(images.filter(i => i.id !== img.id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Existing images */}
      {images.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {images.map((img) => (
            <div key={img.id} style={{ position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.alt_text ?? ''}
                style={{
                  width: 80,
                  height: 80,
                  objectFit: 'cover',
                  borderRadius: '0.5rem',
                  background: 'var(--border)',
                  display: 'block',
                }}
              />
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
                }}
              >
                ×
              </button>
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
                  letterSpacing: 0,
                }}
              >
                F
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? 'var(--foreground)' : 'var(--border)'}`,
          borderRadius: '0.625rem',
          padding: '1.75rem 1rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragging ? 'var(--muted)' : 'transparent',
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
            : isDragging
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
