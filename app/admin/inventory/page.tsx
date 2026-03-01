import { createAdminClient } from '@/lib/supabase/server'
import InventoryEditor from './InventoryEditor'

export const metadata = { title: 'Inventory | Admin' }

export default async function InventoryPage() {
  const supabase = await createAdminClient()

  const { data: variants } = await supabase
    .from('product_variants')
    .select(`
      id,
      sku,
      option1_name,
      option1_value,
      option2_name,
      option2_value,
      inventory_quantity,
      inventory_policy,
      products!inner ( id, title, published )
    `)
    .order('created_at', { ascending: true })

  // Group by product
  type VariantRow = {
    id: string
    sku: string | null
    option1_name: string | null
    option1_value: string | null
    option2_name: string | null
    option2_value: string | null
    inventory_quantity: number
    inventory_policy: string
    products: { id: string; title: string; published: boolean }
  }

  const rows = (variants ?? []) as unknown as VariantRow[]

  const grouped = rows.reduce<Record<string, { title: string; variants: VariantRow[] }>>((acc, v) => {
    const pid = v.products.id
    if (!acc[pid]) acc[pid] = { title: v.products.title, variants: [] }
    acc[pid].variants.push(v)
    return acc
  }, {})

  return (
    <div>
      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.75rem',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          margin: '0 0 1.5rem',
        }}
      >
        Inventory
      </h1>

      <InventoryEditor grouped={grouped} />
    </div>
  )
}
