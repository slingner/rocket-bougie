/**
 * Generates framed mockup images for all art prints and uploads them to Supabase Storage.
 *
 * For each print it:
 *  1. Downloads the first product image
 *  2. Crops out the white mat border and Rocket Boogie logo
 *  3. Composites the art into framed-template.png with an inner shadow
 *  4. Uploads to Supabase Storage at products/<id>/framed.jpg
 *  5. Inserts a product_images row at position 10
 *
 * Usage:
 *   npx tsx scripts/generate-framed-mockups.ts             # run for real
 *   npx tsx scripts/generate-framed-mockups.ts --dry-run   # save previews to /tmp, no uploads
 */

import sharp from 'sharp'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

// ── Config ────────────────────────────────────────────────────────────────────
const FRAME_TEMPLATE = path.join(process.env.HOME!, 'Desktop/framed-template.png')

// Portrait frame (original template)
const PORT = {
  frameW: 2226, frameH: 2500,
  openL: 404, openT: 365, openW: 1369, openH: 1753,
}
// Landscape frame (template rotated 90° clockwise, opening coords transform accordingly)
const LAND = {
  frameW: 2500, frameH: 2226,
  openL: 365, openT: 453, openW: 1753, openH: 1369,
}

const BG = { r: 237, g: 237, b: 237 }  // outer background colour

const DRY_RUN  = process.argv.includes('--dry-run')
const PREVIEW_DIR = '/tmp/framed-mockups'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SECRET_KEY as string
)

// ── Art-bounds detection ──────────────────────────────────────────────────────
// Strips the white mat border, drop shadow, and Rocket Boogie logo.
//
// Strategy:
//  - Top / Left: average brightness < 252 — clean white mat, no shadow on these sides.
//  - Bottom / Right: the drop shadow is monochromatic gray (no color saturation).
//    Real art pixels — even watercolor on a white background — have some color.
//    So we scan inward counting pixels where max(R,G,B) − min(R,G,B) > 15.
//    Stop when > 0.3% of the row/column has "colored" pixels → that's the art edge.
async function detectArtBounds(buf: Buffer) {
  const { width, height } = await sharp(buf).metadata()
  if (!width || !height) throw new Error('Could not read dimensions')

  const { data } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })

  const rowAvg = (y: number) => {
    let s = 0
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      s += (data[i] + data[i + 1] + data[i + 2]) / 3
    }
    return s / width
  }

  const colAvg = (x: number) => {
    let s = 0
    for (let y = 0; y < height; y++) {
      const i = (y * width + x) * 4
      s += (data[i] + data[i + 1] + data[i + 2]) / 3
    }
    return s / height
  }

  // Count pixels with meaningful color saturation in a row
  const rowColorCount = (y: number) => {
    let n = 0
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      if (Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2]) > 15) n++
    }
    return n
  }

  const colColorCount = (x: number) => {
    let n = 0
    for (let y = 0; y < height; y++) {
      const i = (y * width + x) * 4
      if (Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2]) > 15) n++
    }
    return n
  }

  const MIN_COLOR_FRAC = 0.003  // 0.3% of pixels must be "colored"

  let top = 0, left = 0, bottom = height - 1, right = width - 1

  // Top / Left: brightness-based (clean mat edge, no shadow)
  for (let y = 0; y < height / 2; y++) { if (rowAvg(y) < 252) { top = y; break } }
  for (let x = 0; x < width / 2; x++) { if (colAvg(x) < 252) { left = x; break } }

  // Bottom / Right: saturation-based (skips the monochromatic drop shadow)
  for (let y = height - 1; y > height / 2; y--) {
    if (rowColorCount(y) > width * MIN_COLOR_FRAC) { bottom = y; break }
  }
  for (let x = width - 1; x > width / 2; x--) {
    if (colColorCount(x) > height * MIN_COLOR_FRAC) { right = x; break }
  }

  // Add a 2px margin so we don't clip the very edge of the art
  top    = Math.max(0, top - 2)
  left   = Math.max(0, left - 2)
  bottom = Math.min(height - 1, bottom + 2)
  right  = Math.min(width - 1, right + 2)

  return {
    left, top,
    cropW: right - left + 1,
    cropH: bottom - top + 1,
  }
}

// ── Inner shadow overlay ──────────────────────────────────────────────────────
// Simulates the art sitting inside the frame's depth: gradient on left + top edges.
function buildShadowOverlay(w: number, h: number): Buffer {
  const SL = Math.round(w * 0.04)  // left shadow width  (~55px)
  const ST = Math.round(h * 0.025) // top shadow height  (~44px)
  const AL = 90  // max alpha, left
  const AT = 50  // max alpha, top

  const buf = Buffer.alloc(w * h * 4, 0)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let a = 0
      if (x < SL) a = Math.max(a, Math.round(AL * (1 - x / SL)))
      if (y < ST) a = Math.max(a, Math.round(AT * (1 - y / ST)))
      buf[(y * w + x) * 4 + 3] = a
    }
  }
  return buf
}

// ── Build one framed mockup ───────────────────────────────────────────────────
async function buildFramedMockup(imageUrl: string): Promise<Buffer> {
  const res = await fetch(imageUrl)
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${imageUrl}`)
  const rawBuf = Buffer.from(await res.arrayBuffer())

  // 1. Detect and crop the white mat border + drop shadow
  const { left, top, cropW, cropH } = await detectArtBounds(rawBuf)
  const artBuf = await sharp(rawBuf)
    .extract({ left, top, width: cropW, height: cropH })
    .toBuffer()

  // 2. Choose portrait or landscape frame based on art orientation
  const isLandscape = cropW > cropH
  const frame = isLandscape ? LAND : PORT

  // For landscape, we rotate the frame template 90° clockwise on the fly
  const framePng = isLandscape
    ? await sharp(FRAME_TEMPLATE).rotate(90).toBuffer()
    : FRAME_TEMPLATE

  // 3. Resize art to fill the opening exactly (cover = fill + centre-crop, no gaps)
  const resized = await sharp(artBuf)
    .resize(frame.openW, frame.openH, { fit: 'cover', position: 'centre' })
    .toBuffer()

  // 4. Build inner shadow and composite it onto the resized art
  const shadowPng = await sharp(
    buildShadowOverlay(frame.openW, frame.openH),
    { raw: { width: frame.openW, height: frame.openH, channels: 4 } }
  ).png().toBuffer()

  const artWithShadow = await sharp(resized)
    .composite([{ input: shadowPng, blend: 'over' }])
    .toBuffer()

  // 5. Place art on a canvas the full frame size, then overlay the frame template
  return sharp({
    create: { width: frame.frameW, height: frame.frameH, channels: 4, background: { ...BG, alpha: 1 } },
  })
    .composite([
      { input: artWithShadow, left: frame.openL, top: frame.openT },
      { input: framePng },
    ])
    .flatten({ background: BG })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer()
}

// ── Upload to Supabase Storage ────────────────────────────────────────────────
async function uploadMockup(productId: string, buf: Buffer): Promise<string> {
  const storagePath = `products/${productId}/framed.jpg`
  const { error } = await supabase.storage
    .from('product-images')
    .upload(storagePath, buf, { contentType: 'image/jpeg', upsert: true })
  if (error) throw new Error(`Upload failed: ${error.message}`)
  return supabase.storage.from('product-images').getPublicUrl(storagePath).data.publicUrl
}

// ── Insert / update product_images record ────────────────────────────────────
async function upsertImageRecord(productId: string, url: string, title: string) {
  const { data: existing } = await supabase
    .from('product_images')
    .select('id')
    .eq('product_id', productId)
    .ilike('alt_text', '%framed%')
    .maybeSingle()

  if (existing) {
    await supabase.from('product_images').update({ url }).eq('id', existing.id)
    return 'updated'
  }

  const { error } = await supabase.from('product_images').insert({
    product_id: productId,
    url,
    alt_text: `${title} — Framed`,
    position: 10,
  })
  if (error) throw new Error(`DB insert failed: ${error.message}`)
  return 'inserted'
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(FRAME_TEMPLATE)) {
    console.error(`Frame template not found: ${FRAME_TEMPLATE}`)
    process.exit(1)
  }

  if (DRY_RUN) {
    fs.mkdirSync(PREVIEW_DIR, { recursive: true })
    console.log(`🔍 DRY RUN — saving previews to ${PREVIEW_DIR}\n`)
  } else {
    console.log('🖼  Generating and uploading framed mockups…\n')
  }

  const { data: products, error } = await supabase
    .from('products')
    .select('id, handle, title, tags, product_images(url, position)')
    .eq('published', true)
    .contains('tags', ['print'])

  if (error) { console.error(error); process.exit(1) }

  const prints = (products ?? []).filter(
    (p) => !(p.tags as string[]).includes('mini-print')
  )

  console.log(`Found ${prints.length} art prints\n`)

  let success = 0, fail = 0

  for (const product of prints) {
    const firstImage = (product.product_images as any[])
      ?.sort((a: any, b: any) => a.position - b.position)[0]

    if (!firstImage?.url) {
      console.log(`⚠  ${product.handle} — no image, skipping`)
      continue
    }

    process.stdout.write(`  ${product.handle}… `)

    try {
      const mockup = await buildFramedMockup(firstImage.url)

      if (DRY_RUN) {
        fs.writeFileSync(path.join(PREVIEW_DIR, `${product.handle}.jpg`), mockup)
        console.log('saved')
      } else {
        const url = await uploadMockup(product.id, mockup)
        const action = await upsertImageRecord(product.id, url, product.title)
        console.log(action)
        success++
      }
    } catch (err: any) {
      console.log(`FAILED — ${err.message}`)
      fail++
    }
  }

  const summary = DRY_RUN
    ? `\nDone — check ${PREVIEW_DIR}/`
    : `\nDone — ${success} uploaded, ${fail} failed`
  console.log(summary)
}

main()
