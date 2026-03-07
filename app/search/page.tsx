import Nav from '@/components/Nav'
import ProductCard from '@/components/ProductCard'
import SearchInput from './SearchInput'
import { searchProducts, getSuggestions, type SearchProduct } from '@/lib/search'

export const metadata = { title: 'Search | Rocket Boogie Co.' }

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  const [products, suggestions] = await Promise.all([
    query ? searchProducts(query, 200) : Promise.resolve([]),
    getSuggestions(),
  ])

  const noResults = query && products.length === 0

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
        {query && products.length > 0 && (
          <>
            <p style={{ fontSize: '0.875rem', opacity: 0.45, marginBottom: '1.5rem' }}>
              {products.length} result{products.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
            </p>
            <SuggestionsGrid products={products} />
          </>
        )}

        {/* No results — show suggestions */}
        {noResults && (
          <>
            <p style={{ fontSize: '0.875rem', opacity: 0.45, marginBottom: '2.5rem' }}>
              No results for &ldquo;{query}&rdquo;
            </p>
            <SuggestionsSection products={suggestions} heading="You might like" />
          </>
        )}

        {/* No query — show popular picks */}
        {!query && <SuggestionsSection products={suggestions} heading="Popular picks" />}

      </main>
    </>
  )
}

function SuggestionsGrid({ products }: { products: SearchProduct[] }) {
  return (
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
          productId={p.productId}
          variants={p.variants}
          tags={p.tags}
        />
      ))}
    </div>
  )
}

function SuggestionsSection({ products, heading }: { products: SearchProduct[]; heading: string }) {
  if (products.length === 0) return null
  return (
    <section>
      <p
        style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          opacity: 0.4,
          marginBottom: '1.25rem',
        }}
      >
        {heading}
      </p>
      <SuggestionsGrid products={products} />
    </section>
  )
}
