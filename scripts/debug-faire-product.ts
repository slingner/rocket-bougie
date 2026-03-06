/**
 * Debug: print a single Faire product's fields
 * Run with:
 *   npx dotenv-cli -e .env.local -- npx tsx scripts/debug-faire-product.ts
 */

import { listFaireProducts } from '../lib/faire'

async function main() {
  const products = await listFaireProducts()
  const p = products.find(p => p.lifecycle_state === 'PUBLISHED') ?? products[0]
  console.log('Product fields:', JSON.stringify(p, null, 2))
}

main().catch(console.error)
