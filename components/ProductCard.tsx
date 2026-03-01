import Link from 'next/link'
import Image from 'next/image'

interface ProductCardProps {
  handle: string
  title: string
  price: number
  imageUrl: string | null
  imageAlt: string | null
}

export default function ProductCard({ handle, title, price, imageUrl, imageAlt }: ProductCardProps) {
  return (
    <Link
      href={`/products/${handle}`}
      className="group no-underline"
      style={{ color: 'var(--foreground)' }}
    >
      {/* Image */}
      <div
        style={{
          background: 'var(--muted)',
          borderRadius: '0.75rem',
          overflow: 'hidden',
          aspectRatio: '1 / 1',
          position: 'relative',
        }}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt || title}
            fill
            sizes="(max-width: 640px) calc(50vw - 2rem), (max-width: 1024px) 33vw, 20vw"
            style={{ objectFit: 'cover', transition: 'transform 0.4s ease' }}
            className="group-hover:scale-105"
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.3,
              fontSize: '2rem',
            }}
          >
            🚀
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        <p
          style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            lineHeight: 1.3,
            margin: 0,
          }}
          className="group-hover:opacity-70 transition-opacity"
        >
          {title}
        </p>
        <p
          style={{
            fontSize: '0.875rem',
            opacity: 0.6,
            margin: 0,
          }}
        >
          From ${price.toFixed(2)}
        </p>
      </div>
    </Link>
  )
}
