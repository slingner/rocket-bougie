/**
 * Migrate sticker product videos from Shopify to Supabase Storage.
 *
 * For each sticker product:
 *   1. Fetch the product page from rocketboogie.com
 *   2. Extract the video source URL
 *   3. Download the original MP4
 *   4. Re-encode with ffmpeg (720p, CRF 26, ~70% smaller)
 *   5. Upload to Supabase Storage at product-videos/{handle}.mp4
 *   6. Save the public URL to products.video_url
 *
 * Usage:
 *   npx tsx scripts/migrate-videos.ts
 *
 * Requirements:
 *   brew install ffmpeg
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { execSync } from 'child_process'
import * as https from 'https'
import * as http from 'http'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY!
const SHOPIFY_BASE = 'https://rocketboogie.com'
const BUCKET = 'product-videos'
const TMP_DIR = path.join(os.tmpdir(), 'rb-videos')

// ---------------------------------------------------------------------------
// Supabase client
// ---------------------------------------------------------------------------

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const fullUrl = url.startsWith('//') ? `https:${url}` : url
    const client = fullUrl.startsWith('https') ? https : http
    const file = fs.createWriteStream(dest)
    client.get(fullUrl, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        file.close()
        return download(res.headers.location!, dest).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        file.close()
        fs.unlinkSync(dest)
        return reject(new Error(`HTTP ${res.statusCode} for ${fullUrl}`))
      }
      res.pipe(file)
      file.on('finish', () => file.close(() => resolve()))
      file.on('error', (err) => { fs.unlinkSync(dest); reject(err) })
    }).on('error', reject)
  })
}

async function fetchPageHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; migration-script/1.0)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.text()
}

function extractVideoUrl(html: string): string | null {
  // Matches: <source src="//rocketboogie.com/cdn/shop/videos/c/vp/HASH/HASH.HD-...mp4?v=0"
  const match = html.match(/<source[^>]+src="(\/\/rocketboogie\.com\/cdn\/shop\/videos\/[^"]+\.mp4[^"]*)"/)
  return match ? match[1] : null
}

function compress(input: string, output: string): void {
  // Re-encode to H.264, cap at 720p, CRF 26 (good quality, ~70% smaller than 1080p 7.2Mbps original)
  execSync(
    `ffmpeg -y -i "${input}" -vf "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease" ` +
    `-c:v libx264 -crf 26 -preset fast -movflags +faststart -an "${output}"`,
    { stdio: 'pipe' }
  )
}

async function uploadToSupabase(filePath: string, handle: string): Promise<string> {
  const buffer = fs.readFileSync(filePath)
  const storagePath = `${handle}.mp4`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: 'video/mp4',
      upsert: true,
    })

  if (error) throw new Error(`Upload failed for ${handle}: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Ensure ffmpeg is available
  try {
    execSync('which ffmpeg', { stdio: 'pipe' })
  } catch {
    console.error('❌ ffmpeg not found. Run: brew install ffmpeg')
    process.exit(1)
  }

  // Ensure storage bucket exists (create if missing)
  const { data: buckets } = await supabase.storage.listBuckets()
  const bucketExists = buckets?.some((b) => b.name === BUCKET)
  if (!bucketExists) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true })
    if (error) throw new Error(`Failed to create bucket: ${error.message}`)
    console.log(`Created storage bucket: ${BUCKET}`)
  }

  // Fetch all sticker products
  const { data: products, error } = await supabase
    .from('products')
    .select('id, handle, title, video_url')
    .contains('tags', ['sticker'])
    .eq('published', true)
    .order('title')

  if (error) throw error
  console.log(`Found ${products.length} sticker products\n`)

  // Temp dir for downloads
  fs.mkdirSync(TMP_DIR, { recursive: true })

  let migrated = 0
  let skipped = 0
  let failed = 0

  for (const product of products) {
    const { handle, title } = product
    process.stdout.write(`${title} ... `)

    // Skip if already done
    if (product.video_url) {
      console.log('already migrated, skipping')
      skipped++
      continue
    }

    const rawPath = path.join(TMP_DIR, `${handle}.original.mp4`)
    const compressedPath = path.join(TMP_DIR, `${handle}.mp4`)

    try {
      // 1. Fetch product page and extract video URL
      const html = await fetchPageHtml(`${SHOPIFY_BASE}/products/${handle}`)
      const videoUrl = extractVideoUrl(html)

      if (!videoUrl) {
        console.log('no video found')
        skipped++
        continue
      }

      // 2. Download original
      await download(videoUrl, rawPath)
      const originalSize = Math.round(fs.statSync(rawPath).size / 1024)

      // 3. Compress
      compress(rawPath, compressedPath)
      const compressedSize = Math.round(fs.statSync(compressedPath).size / 1024)
      const saving = Math.round((1 - compressedSize / originalSize) * 100)

      // 4. Upload to Supabase Storage
      const publicUrl = await uploadToSupabase(compressedPath, handle)

      // 5. Save URL to DB
      await supabase
        .from('products')
        .update({ video_url: publicUrl })
        .eq('id', product.id)

      console.log(`✓  ${originalSize}KB → ${compressedSize}KB (${saving}% smaller)`)
      migrated++

    } catch (err) {
      console.log(`✗  ${(err as Error).message}`)
      failed++
    } finally {
      // Clean up temp files
      if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath)
      if (fs.existsSync(compressedPath)) fs.unlinkSync(compressedPath)
    }
  }

  console.log(`\nDone. Migrated: ${migrated}, Skipped: ${skipped}, Failed: ${failed}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
