import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toCardVariants } from '@/lib/cardVariants'

const PAGE_SIZE = 24

const PRODUCT_SELECT = `
  id, handle, title, tags, thumbnail_image_id,
  product_variants (id, price, option1_name, option1_value, option2_value),
  product_images!product_images_product_id_fkey (id, url, alt_text, position)
`

type RawVariant = { id: string; price: number; option1_name: string | null; option1_value: string | null; option2_value: string | null }
type RawImage  = { id: string; url: string; alt_text: string | null; position: number }

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  const collectionTags = searchParams.get('collectionTags')?.split(',').filter(Boolean) ?? null
  const typeTags       = searchParams.get('typeTags')?.split(',').filter(Boolean) ?? null
  const cardCategory   = searchParams.get('cardCategory') ?? null
  const sort           = searchParams.get('sort') ?? 'newest'

  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select(PRODUCT_SELECT, { count: 'exact' })
    .eq('hidden', false)

  if (sort === 'name_asc')  query = query.order('title', { ascending: true })
  else if (sort === 'name_desc') query = query.order('title', { ascending: false })
  else query = query.order('created_at', { ascending: false })

  if (collectionTags?.length) query = query.overlaps('tags', collectionTags)
  if (typeTags?.length)       query = query.overlaps('tags', typeTags)
  if (cardCategory)           query = query.contains('tags', [cardCategory])

  const { data, count } = await query.range(from, to)

  const products = (data ?? []).map((p) => {
    const variants     = (p.product_variants ?? []) as RawVariant[]
    const images       = ((p.product_images ?? []) as RawImage[]).sort((a, b) => a.position - b.position)
    const thumbnail    = p.thumbnail_image_id ? (images.find(i => i.id === p.thumbnail_image_id) ?? images[0]) : images[0]
    return {
      id:        p.id,
      handle:    p.handle,
      title:     p.title,
      price:     variants.length ? Math.min(...variants.map(v => v.price)) : 0,
      imageUrl:  thumbnail?.url ?? null,
      imageAlt:  thumbnail?.alt_text ?? null,
      productId: p.id,
      variants:  toCardVariants(variants),
      tags:      p.tags ?? [],
    }
  })

  return NextResponse.json({ products, totalCount: count ?? 0 })
}
