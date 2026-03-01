import { createAdminClient } from '@/lib/supabase/server'
import TagsEditor from './TagsEditor'

export const metadata = { title: 'Tags | Admin' }

export default async function TagsPage() {
  const supabase = await createAdminClient()

  const { data: products } = await supabase
    .from('products')
    .select('id, tags')

  // Build tag → count map
  const tagCounts = new Map<string, number>()
  for (const product of products ?? []) {
    for (const tag of product.tags ?? []) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
    }
  }

  const tags = Array.from(tagCounts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([tag, count]) => ({ tag, count }))

  return (
    <div style={{ maxWidth: 640 }}>
      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.75rem',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          margin: '0 0 0.375rem',
        }}
      >
        Tags
      </h1>
      <p style={{ fontSize: '0.875rem', opacity: 0.5, margin: '0 0 1.5rem' }}>
        {tags.length} tags across {products?.length ?? 0} products. Renaming a tag updates all products that use it.
      </p>

      <TagsEditor tags={tags} />
    </div>
  )
}
