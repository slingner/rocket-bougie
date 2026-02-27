/**
 * Migrate product images from Shopify CDN to Supabase Storage.
 *
 * Usage:
 *   npx dotenv -e .env.local -- npx tsx scripts/migrate-images.ts
 *
 * What it does:
 *   1. Creates a 'product-images' bucket in Supabase Storage (if not exists)
 *   2. Downloads each image from cdn.shopify.com
 *   3. Uploads to Supabase Storage
 *   4. Updates the URL in product_images and product_variants tables
 *
 * Safe to re-run — only processes rows that still have Shopify CDN URLs.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!
const BUCKET = 'product-images'
const DELAY_MS = 200

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY)

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getExt(url: string): string {
  // Parse just the pathname so query params (?v=123) don't confuse things
  const pathname = new URL(url).pathname
  const match = pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
  return match ? match[1].toLowerCase() : 'jpg'
}

function getContentType(ext: string): string {
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  }
  return map[ext] ?? 'image/jpeg'
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.warn(`  ✗ HTTP ${res.status} for ${url}`)
      return null
    }
    return Buffer.from(await res.arrayBuffer())
  } catch (err) {
    console.warn(`  ✗ Download error for ${url}:`, err)
    return null
  }
}

async function ensureBucket() {
  const { data: buckets, error } = await supabase.storage.listBuckets()
  if (error) throw new Error(`Failed to list buckets: ${error.message}`)

  const exists = buckets?.some((b) => b.name === BUCKET)
  if (exists) {
    console.log(`Bucket already exists: ${BUCKET}`)
    return
  }

  const { error: createError } = await supabase.storage.createBucket(BUCKET, { public: true })
  if (createError) throw new Error(`Failed to create bucket: ${createError.message}`)
  console.log(`Created bucket: ${BUCKET}`)
}

async function migrateProductImages() {
  const { data: images, error } = await supabase
    .from('product_images')
    .select('id, product_id, url, position')
    .like('url', '%cdn.shopify.com%')
    .order('product_id')

  if (error) throw new Error(`Failed to fetch product images: ${error.message}`)
  if (!images || images.length === 0) {
    console.log('No Shopify CDN URLs found in product_images — already migrated or nothing to do.')
    return
  }

  console.log(`\nMigrating ${images.length} product images...`)
  let success = 0
  let failed = 0

  for (const img of images) {
    const ext = getExt(img.url)
    const storagePath = `products/${img.product_id}/${img.position}.${ext}`

    const buffer = await downloadImage(img.url)
    if (!buffer) {
      failed++
      continue
    }

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: getContentType(ext), upsert: true })

    if (uploadError) {
      console.warn(`  ✗ Upload failed (${img.id}): ${uploadError.message}`)
      failed++
      continue
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)

    const { error: updateError } = await supabase
      .from('product_images')
      .update({ url: publicUrl })
      .eq('id', img.id)

    if (updateError) {
      console.warn(`  ✗ DB update failed (${img.id}): ${updateError.message}`)
      failed++
      continue
    }

    console.log(`  ✓ ${storagePath}`)
    success++
    await sleep(DELAY_MS)
  }

  console.log(`Product images done: ${success} migrated, ${failed} failed`)
}

async function migrateVariantImages() {
  const { data: variants, error } = await supabase
    .from('product_variants')
    .select('id, variant_image_url')
    .like('variant_image_url', '%cdn.shopify.com%')

  if (error) throw new Error(`Failed to fetch product variants: ${error.message}`)
  if (!variants || variants.length === 0) {
    console.log('No Shopify CDN URLs found in product_variants — already migrated or nothing to do.')
    return
  }

  console.log(`\nMigrating ${variants.length} variant images...`)
  let success = 0
  let failed = 0

  for (const v of variants) {
    const ext = getExt(v.variant_image_url)
    const storagePath = `variants/${v.id}.${ext}`

    const buffer = await downloadImage(v.variant_image_url)
    if (!buffer) {
      failed++
      continue
    }

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: getContentType(ext), upsert: true })

    if (uploadError) {
      console.warn(`  ✗ Upload failed (variant ${v.id}): ${uploadError.message}`)
      failed++
      continue
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)

    const { error: updateError } = await supabase
      .from('product_variants')
      .update({ variant_image_url: publicUrl })
      .eq('id', v.id)

    if (updateError) {
      console.warn(`  ✗ DB update failed (variant ${v.id}): ${updateError.message}`)
      failed++
      continue
    }

    console.log(`  ✓ ${storagePath}`)
    success++
    await sleep(DELAY_MS)
  }

  console.log(`Variant images done: ${success} migrated, ${failed} failed`)
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY')
    process.exit(1)
  }

  await ensureBucket()
  await migrateProductImages()
  await migrateVariantImages()
  console.log('\nAll done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
