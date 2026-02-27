import Link from 'next/link'
import ProductForm from '../ProductForm'

export const metadata = { title: 'New Product — Admin' }

export default function NewProductPage() {
  return (
    <div style={{ maxWidth: 860 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
        <Link
          href="/admin/products"
          style={{ fontSize: '0.875rem', opacity: 0.5, textDecoration: 'none', color: 'inherit' }}
          className="hover:opacity-100"
        >
          ← Products
        </Link>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.6rem',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          New product
        </h1>
      </div>

      <ProductForm mode="new" />
    </div>
  )
}
