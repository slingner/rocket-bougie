/**
 * Tests the crop detection across all print images to verify consistency.
 * Saves test crops to /tmp/framed-test/ for visual inspection.
 */
import sharp from 'sharp'
import * as fs from 'fs'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SECRET_KEY as string
)

/**
 * Detects the inner art boundary in a print mockup image.
 *
 * Strategy:
 *  - Top / Left: scan inward with threshold 252 — these sides have clean white mat, no shadow
 *  - Bottom / Right: the drop shadow bleeds into the white mat, so we scan inward
 *    with a stricter threshold (235) to find where actual art content ends vs. shadow
 */
export async function detectArtBounds(buf: Buffer) {
  const { width, height } = await sharp(buf).metadata()
  if (!width || !height) throw new Error('Could not read dimensions')

  const { data } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })

  const rowAvg = (y: number) => {
    let sum = 0
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      sum += (data[i] + data[i + 1] + data[i + 2]) / 3
    }
    return sum / width
  }

  const colAvg = (x: number) => {
    let sum = 0
    for (let y = 0; y < height; y++) {
      const i = (y * width + x) * 4
      sum += (data[i] + data[i + 1] + data[i + 2]) / 3
    }
    return sum / height
  }

  // Top and left: clean mat edge, threshold 252
  let top = 0, left = 0
  for (let y = 0; y < height / 2; y++) {
    if (rowAvg(y) < 252) { top = y; break }
  }
  for (let x = 0; x < width / 2; x++) {
    if (colAvg(x) < 252) { left = x; break }
  }

  // Bottom and right: shadow bleeds into mat, use stricter threshold 235
  // to find where actual art content (not shadow) ends
  let bottom = height - 1, right = width - 1
  for (let y = height - 1; y > height / 2; y--) {
    if (rowAvg(y) < 235) { bottom = y; break }
  }
  for (let x = width - 1; x > width / 2; x--) {
    if (colAvg(x) < 235) { right = x; break }
  }

  return { top, left, bottom, right, width, height }
}

async function testAll() {
  const outDir = '/tmp/framed-test'
  fs.mkdirSync(outDir, { recursive: true })

  const { data: products } = await supabase
    .from('products')
    .select('id, handle, title, tags, product_images(url, position)')
    .eq('published', true)
    .contains('tags', ['print'])

  const prints = (products ?? []).filter(
    (p) => !(p.tags as string[]).includes('mini-print')
  )

  console.log(`Testing ${prints.length} prints...\n`)

  for (const product of prints) {
    const firstImage = (product.product_images as any[])
      ?.sort((a: any, b: any) => a.position - b.position)[0]
    if (!firstImage?.url) { console.log(`  ${product.handle}: no image`); continue }

    const res = await fetch(firstImage.url)
    const buf = Buffer.from(await res.arrayBuffer())

    const bounds = await detectArtBounds(buf)
    const cropW = bounds.right - bounds.left + 1
    const cropH = bounds.bottom - bounds.top + 1

    console.log(`  ${product.handle}: crop (${bounds.left},${bounds.top})→(${bounds.right},${bounds.bottom}) = ${cropW}×${cropH}`)

    // Save a small preview of the crop
    await sharp(buf)
      .extract({ left: bounds.left, top: bounds.top, width: cropW, height: cropH })
      .resize(400)
      .jpeg({ quality: 80 })
      .toFile(`${outDir}/${product.handle}.jpg`)
  }

  console.log(`\nSaved previews to ${outDir}/`)
}

testAll()
