/**
 * Import Shopify product CSV into Supabase.
 *
 * Usage:
 *   npx tsx scripts/import-shopify-products.ts ~/Desktop/products_export_1.csv
 *
 * Skips Printify and gift card products.
 * Safe to re-run — upserts by handle/sku.
 */

import { createClient } from '@supabase/supabase-js'
import { parse } from 'csv-parse/sync'
import * as fs from 'fs'
import * as path from 'path'

// ---------------------------------------------------------------------------
// Supabase client (uses service role key to bypass RLS)
// ---------------------------------------------------------------------------

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CsvRow {
  Handle: string
  Title: string
  'Body (HTML)': string
  Vendor: string
  Type: string
  Tags: string
  Published: string
  'Option1 Name': string
  'Option1 Value': string
  'Option2 Name': string
  'Option2 Value': string
  'Option3 Name': string
  'Option3 Value': string
  'Variant SKU': string
  'Variant Inventory Policy': string
  'Variant Fulfillment Service': string
  'Variant Price': string
  'Variant Compare At Price': string
  'Variant Requires Shipping': string
  'Variant Taxable': string
  'Variant Weight Unit': string
  'Image Src': string
  'Image Position': string
  'Image Alt Text': string
  'Gift Card': string
  'SEO Title': string
  'SEO Description': string
  'Variant Image': string
  Status: string
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const csvPath = process.argv[2]
  if (!csvPath) {
    console.error('Usage: npx tsx scripts/import-shopify-products.ts <path-to-csv>')
    process.exit(1)
  }

  const csv = fs.readFileSync(path.resolve(csvPath), 'utf-8')
  const rows: CsvRow[] = parse(csv, { columns: true, skip_empty_lines: true })

  // Group rows by handle so we can build each product from multiple rows
  const byHandle = new Map<string, CsvRow[]>()
  for (const row of rows) {
    if (!row.Handle) continue
    if (!byHandle.has(row.Handle)) byHandle.set(row.Handle, [])
    byHandle.get(row.Handle)!.push(row)
  }

  console.log(`Found ${byHandle.size} products in CSV`)

  let imported = 0
  let skipped = 0

  for (const [handle, productRows] of byHandle) {
    const first = productRows[0]

    // Skip Printify products
    if (first['Variant Fulfillment Service'] === 'printify') {
      skipped++
      continue
    }

    // Skip gift cards
    if (first['Gift Card'] === 'true') {
      skipped++
      continue
    }

    // Skip inactive products
    if (first.Status === 'draft') {
      skipped++
      continue
    }

    // ---- Upsert product --------------------------------------------------
    const { data: product, error: productError } = await supabase
      .from('products')
      .upsert(
        {
          handle,
          title: first.Title,
          description: first['Body (HTML)'] || null,
          vendor: first.Vendor || 'Rocket Boogie Co.',
          product_type: first.Type || null,
          tags: first.Tags
            ? first.Tags.split(',').map((t) => t.trim()).filter(Boolean)
            : [],
          published: first.Published === 'true',
          fulfillment_service: 'manual',
          seo_title: first['SEO Title'] || null,
          seo_description: first['SEO Description'] || null,
        },
        { onConflict: 'handle' }
      )
      .select('id')
      .single()

    if (productError || !product) {
      console.error(`Error upserting product ${handle}:`, productError?.message)
      continue
    }

    const productId = product.id

    // ---- Insert variants -------------------------------------------------
    const variantRows = productRows.filter((r) => r['Variant Price'])

    await supabase.from('product_variants').delete().eq('product_id', productId)

    const variants = variantRows.map((vRow) => ({
      product_id: productId,
      sku: vRow['Variant SKU'] || null,
      option1_name: vRow['Option1 Name'] || null,
      option1_value: vRow['Option1 Value'] || null,
      option2_name: vRow['Option2 Name'] || null,
      option2_value: vRow['Option2 Value'] || null,
      option3_name: vRow['Option3 Name'] || null,
      option3_value: vRow['Option3 Value'] || null,
      price: parseFloat(vRow['Variant Price']),
      compare_at_price: vRow['Variant Compare At Price']
        ? parseFloat(vRow['Variant Compare At Price'])
        : null,
      inventory_quantity: 0,
      // Shopify's CSV doesn't export inventory counts, so we can't know the real quantity.
      // Default to 'continue' (don't block sales when quantity hits 0) — the admin
      // can manually flip specific variants to 'deny' when something is actually sold out.
      inventory_policy: 'continue',
      requires_shipping: vRow['Variant Requires Shipping'] === 'true',
      taxable: vRow['Variant Taxable'] === 'true',
      weight_unit: vRow['Variant Weight Unit'] || 'lb',
      variant_image_url: vRow['Variant Image'] || null,
    }))

    if (variants.length > 0) {
      const { error: variantError } = await supabase.from('product_variants').insert(variants)
      if (variantError) {
        console.error(`Error inserting variants for ${handle}:`, variantError.message)
      }
    }

    // ---- Upsert images ---------------------------------------------------
    // Image rows: any row with Image Src and Image Position
    const imageRows = productRows.filter((r) => r['Image Src'] && r['Image Position'])

    // Delete existing images for this product before reinserting (simplest approach)
    await supabase.from('product_images').delete().eq('product_id', productId)

    const images = imageRows.map((r) => ({
      product_id: productId,
      url: r['Image Src'],
      position: parseInt(r['Image Position']) || 1,
      alt_text: r['Image Alt Text'] || null,
    }))

    if (images.length > 0) {
      const { error: imageError } = await supabase.from('product_images').insert(images)
      if (imageError) {
        console.error(`Error inserting images for ${handle}:`, imageError.message)
      }
    }

    console.log(`✓ ${handle} (${variantRows.length} variant${variantRows.length !== 1 ? 's' : ''}, ${images.length} image${images.length !== 1 ? 's' : ''})`)
    imported++
  }

  console.log(`\nDone. Imported: ${imported}, Skipped: ${skipped}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
