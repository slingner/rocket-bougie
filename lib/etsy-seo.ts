// Etsy tag + material generator.
// Mini prints, stickers, and greeting cards use fixed optimized lists.
// Art prints use Claude to generate product-specific SEO tags.

import Anthropic from '@anthropic-ai/sdk'

// ─── Fixed lists ────────────────────────────────────────────────────────────

export const FIXED_TAGS: Record<string, string[]> = {
  'Mini Print': [
    'mini art prints', 'postcard wall art', '4x6 art print',
    'small wall decor', 'gallery wall art', 'affordable art',
    'postcard art print', 'mini poster card', 'desk decor art',
    'gift under 10', 'stocking stuffer', 'apartment wall art',
    'snail mail postcard',
  ],
  'Sticker': [
    'vinyl stickers', 'waterproof stickers', 'laptop stickers',
    'water bottle decal', 'durable vinyl decal', 'UV resistant sticker',
    'aesthetic stickers', 'custom vinyl sticker', 'die cut stickers',
    'matte finish sticker', 'indoor stickers', 'notebook stickers',
    'scratch resistant',
  ],
  'Sticker Pack': [
    'vinyl stickers', 'waterproof stickers', 'laptop stickers',
    'water bottle decal', 'durable vinyl decal', 'UV resistant sticker',
    'aesthetic stickers', 'custom vinyl sticker', 'die cut stickers',
    'matte finish sticker', 'indoor stickers', 'notebook stickers',
    'scratch resistant',
  ],
}

export const FIXED_MATERIALS: Record<string, string[]> = {
  'Print': [
    'premium cardstock', 'matte finish print', 'thick paper stock',
    'heavy cardstock', 'uncoated cardstock', 'matte cardstock',
    'archival paper', 'museum quality paper', 'acid free paper',
    'sustainable paper', 'eco friendly paper', 'professional print',
    'high quality print',
  ],
  'Mini Print': [
    'premium cardstock', 'matte finish print', 'thick paper stock',
    'heavy cardstock', 'uncoated cardstock', 'matte cardstock',
    'archival paper', 'museum quality paper', 'acid free paper',
    'sustainable paper', 'eco friendly paper', 'professional print',
    'high quality print',
  ],
  'Sticker': [
    'Vinyl', 'Adhesive', 'Laminate',
    'Polyvinyl chloride', 'Acrylic adhesive', 'Protective film',
    'Polymer', 'Backing paper', 'UV stabilizer',
    'Matte finish', 'Water resistant coating', 'Water resistant material',
    'Permanent adhesive',
  ],
  'Sticker Pack': [
    'Vinyl', 'Adhesive', 'Laminate',
    'Polyvinyl chloride', 'Acrylic adhesive', 'Protective film',
    'Polymer', 'Backing paper', 'UV stabilizer',
    'Matte finish', 'Water resistant coating', 'Water resistant material',
    'Permanent adhesive',
  ],
  'Greeting Card': [
    'premium cardstock', 'matte finish print', 'thick paper stock',
    'heavy cardstock', 'uncoated cardstock', 'matte cardstock',
    'archival paper', 'museum quality paper', 'acid free paper',
    'sustainable paper', 'eco friendly paper', 'professional print',
    'high quality print',
  ],
}

// ─── AI-generated tags for art prints ───────────────────────────────────────

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function generateArtPrintTags(
  title: string,
  description: string,
  existingTags: string[],
): Promise<string[]> {
  description = stripHtml(description)
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('[etsy-seo] ANTHROPIC_API_KEY not set, falling back to title-based tags')
    return fallbackArtPrintTags(title, existingTags)
  }

  const client = new Anthropic({ apiKey })

  const prompt = `Generate exactly 13 Etsy tags for an art print listing. Return ONLY a JSON array of 13 strings, no explanation.

Rules:
- Each tag must be 20 characters or fewer
- Lowercase only
- No special characters (no hyphens, accents, slashes)
- Multi-word phrases are better than single words
- Should describe the subject, style, room use, and gift potential
- Think about what buyers actually search for on Etsy

Product title: ${title}
Categories/themes: ${existingTags.join(', ')}
Description: ${description?.slice(0, 300) ?? ''}

Return only the JSON array, e.g.: ["tag one", "tag two", ...]`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) return fallbackArtPrintTags(title, existingTags)

  const parsed: string[] = JSON.parse(match[0])
  return parsed
    .map(t => t.toLowerCase().trim().replace(/[^a-z0-9 ]/g, ''))
    .filter(t => t.length >= 2 && t.length <= 20)
    .slice(0, 13)
}

function fallbackArtPrintTags(title: string, existingTags: string[]): string[] {
  const base = ['art print', 'wall art', 'wall decor', 'home decor', 'giclee print', 'fine art print', 'illustration', 'room decor', 'art poster']
  const titleWords = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2)
  const tagPhrases = existingTags.flatMap(t => {
    const lc = t.toLowerCase()
    return [`${lc} art`, `${lc} print`].filter(p => p.length <= 20)
  })
  const all = [...tagPhrases, ...base, ...titleWords]
  const seen = new Set<string>()
  const result: string[] = []
  for (const t of all) {
    if (!seen.has(t) && t.length <= 20) { seen.add(t); result.push(t) }
    if (result.length === 13) break
  }
  return result
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function generateEtsyTagsAndMaterials(
  title: string,
  productType: string,
  existingTags: string[],
  description?: string,
): Promise<{ tags: string[]; materials: string[] }> {
  const materials = FIXED_MATERIALS[productType] ?? FIXED_MATERIALS['Print']

  if (productType === 'Print') {
    const tags = await generateArtPrintTags(title, description ?? '', existingTags)
    return { tags, materials }
  }

  const tags = FIXED_TAGS[productType] ?? fallbackArtPrintTags(title, existingTags)
  return { tags, materials }
}
