/**
 * One-time script to match your existing Faire products to your DB products by title.
 * Stores the Faire product/variant IDs so future syncs update instead of recreate.
 *
 * Run with:
 *   npx dotenv-cli -e .env.local -- npx tsx scripts/link-faire-products.ts
 */

import { createClient } from '@supabase/supabase-js'
import { listFaireProducts } from '../lib/faire'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

function normalize(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '')
}

async function main() {
  console.log('Fetching products from Faire...')
  const faireProducts = await listFaireProducts()
  console.log(`Found ${faireProducts.length} products on Faire`)

  // Build a map of normalized title -> faire product
  const faireByTitle = new Map(
    faireProducts.map((p) => [normalize(p.name), p])
  )

  // Fetch all products from DB
  const { data: dbProducts, error } = await supabase
    .from('products')
    .select('id, title')

  if (error) throw error
  console.log(`Found ${dbProducts.length} products in DB`)

  let matched = 0
  let unmatched: string[] = []

  for (const dbProduct of dbProducts) {
    const faireProduct = faireByTitle.get(normalize(dbProduct.title))

    if (!faireProduct) {
      unmatched.push(dbProduct.title)
      continue
    }

    // Update product with faire_product_id
    await supabase
      .from('products')
      .update({ faire_product_id: faireProduct.id })
      .eq('id', dbProduct.id)

    // Update variants with faire_variant_ids (match by position since titles may not have SKUs)
    const { data: dbVariants } = await supabase
      .from('product_variants')
      .select('id, option1_value, option2_value')
      .eq('product_id', dbProduct.id)
      .order('created_at')

    for (const dbVariant of dbVariants ?? []) {
      // Try to match by option value
      const faireVariant = faireProduct.variants.find((v) =>
        v.options.some(
          (o) =>
            normalize(o.value) === normalize(dbVariant.option1_value ?? '') ||
            normalize(o.value) === normalize(dbVariant.option2_value ?? '')
        )
      ) ?? faireProduct.variants[0] // fall back to first variant for single-variant products

      if (faireVariant) {
        await supabase
          .from('product_variants')
          .update({ faire_variant_id: faireVariant.id })
          .eq('id', dbVariant.id)
      }
    }

    matched++
  }

  console.log(`\nMatched: ${matched} / ${dbProducts.length}`)

  if (unmatched.length > 0) {
    console.log(`\nUnmatched (${unmatched.length}):`)
    unmatched.forEach((t) => console.log(`  - ${t}`))
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
