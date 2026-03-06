import Nav from '@/components/Nav'
import ProductCard from '@/components/ProductCard'
import SearchInput from './SearchInput'
import { searchProducts } from '@/lib/search'

export const metadata = { title: 'Search | Rocket Boogie Co.' }

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  const products = query ? await searchProducts(query, 200) : []

  return (
    <>
      <Nav />
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>

        {/* Search bar */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '3rem',
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              margin: '0 0 0.5rem',
              textAlign: 'center',
            }}
          >
            Search
          </h1>
          <SearchInput defaultValue={query} />
        </div>

        {/* Results */}
        {query && (
          <>
            <p style={{ fontSize: '0.875rem', opacity: 0.45, marginBottom: '1.5rem' }}>
              {products.length === 0
                ? `No results for "${query}"`
                : `${products.length} result${products.length !== 1 ? 's' : ''} for "${query}"`}
            </p>

            {products.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))',
                  gap: '1.5rem 1rem',
                }}
              >
                {products.map((p) => (
                  <ProductCard
                    key={p.handle}
                    handle={p.handle}
                    title={p.title}
                    price={p.price}
                    imageUrl={p.imageUrl}
                    imageAlt={null}
                  />
                ))}
              </div>
            )}

            {products.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '4rem 0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <p style={{ fontSize: '2rem', opacity: 0.2 }}>🔍</p>
                <p style={{ opacity: 0.4, fontSize: '0.95rem' }}>
                  Try a different search, or{' '}
                  <a href="/shop" style={{ color: 'var(--foreground)', fontWeight: 600 }}>
                    browse all products
                  </a>
                  .
                </p>
              </div>
            )}
          </>
        )}

        {!query && (
          <div style={{ textAlign: 'center', padding: '2rem 0', opacity: 0.35, fontSize: '0.9rem' }}>
            Start typing to search products.
          </div>
        )}

      </main>
    </>
  )
}
