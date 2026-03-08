import { createAdminClient } from '@/lib/supabase/server'
import CollectionsManager from './CollectionsManager'

export const metadata = { title: 'Collections | Admin' }

export default async function CollectionsPage() {
  const supabase = await createAdminClient()
  const { data: collections } = await supabase
    .from('collections')
    .select('*')
    .order('sort_order', { ascending: true })

  return (
    <div style={{ maxWidth: 720 }}>
      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.75rem',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          margin: '0 0 1.75rem',
        }}
      >
        Collections
      </h1>
      <CollectionsManager collections={collections ?? []} />
    </div>
  )
}
