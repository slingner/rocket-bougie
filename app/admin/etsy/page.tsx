import { isEtsyConnected, getShopListings } from '@/lib/etsy'
import { createAdminClient } from '@/lib/supabase/server'
import { getUnlinkedLocalProducts } from './actions'
import EtsyManager from './EtsyManager'

export const metadata = { title: 'Etsy | Admin' }

export default async function EtsyPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>
}) {
  const params = await searchParams
  const connected = await isEtsyConnected()

  if (!connected) {
    return (
      <div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          Etsy
        </h1>
        <p style={{ opacity: 0.6, marginBottom: '2rem', fontSize: '0.9rem' }}>
          Connect your Etsy shop to browse listings, import products, and push changes back to Etsy.
        </p>
        {params.error && (
          <p style={{ color: '#dc2626', marginBottom: '1rem', fontSize: '0.875rem' }}>
            OAuth error: {params.error.replace(/_/g, ' ')}. Please try again.
          </p>
        )}
        <a
          href="/api/etsy/connect"
          style={{
            display: 'inline-block',
            padding: '0.625rem 1.25rem',
            background: '#F1641E',
            color: '#fff',
            borderRadius: 6,
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          Connect Etsy Shop
        </a>
        <p style={{ marginTop: '1rem', fontSize: '0.8rem', opacity: 0.5 }}>
          You&apos;ll be redirected to Etsy to authorize access to your listings.
        </p>
      </div>
    )
  }

  let listings: Awaited<ReturnType<typeof getShopListings>> = []
  let fetchError: string | null = null

  const db = createAdminClient()
  const [listingsResult, linkedResult, unlinkedProducts] = await Promise.all([
    getShopListings('active').catch((err: unknown) => {
      fetchError = err instanceof Error ? err.message : 'Failed to load listings'
      return []
    }),
    db.from('products').select('id, title, handle, etsy_listing_id').not('etsy_listing_id', 'is', null),
    getUnlinkedLocalProducts(),
  ])

  listings = listingsResult
  const linkedProducts = linkedResult.data

  // Map etsy_listing_id → local product for quick lookup
  const linkedMap: Record<string, { id: string; title: string; handle: string }> = {}
  for (const p of linkedProducts ?? []) {
    if (p.etsy_listing_id) linkedMap[p.etsy_listing_id] = p
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.5rem', margin: 0 }}>
          Etsy
        </h1>
        <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>
          {listings.length} active listing{listings.length !== 1 ? 's' : ''}
        </span>
        <a
          href="/api/etsy/connect"
          style={{ marginLeft: 'auto', fontSize: '0.75rem', opacity: 0.45, textDecoration: 'none', color: 'inherit' }}
        >
          Reconnect
        </a>
      </div>

      {params.connected === '1' && (
        <p style={{ color: '#166534', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Etsy connected successfully.
        </p>
      )}

      {fetchError && (
        <p style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' }}>
          {fetchError}
        </p>
      )}

      <EtsyManager
        listings={listings}
        linkedMap={linkedMap}
        unlinkedProducts={unlinkedProducts}
      />
    </div>
  )
}
