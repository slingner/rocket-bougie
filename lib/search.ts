import { createClient } from '@/lib/supabase/server'
import { toCardVariants } from '@/lib/cardVariants'
import type { CardVariant } from '@/components/AddToCartButton'

export type SearchProduct = {
  handle: string
  title: string
  price: number
  imageUrl: string | null
  productId: string
  variants: CardVariant[]
  tags: string[]
}

const PRODUCT_SELECT = 'id, handle, title, tags, product_variants(id, price, option1_name, option1_value, option2_value), product_images!product_images_product_id_fkey(url, alt_text, position)'

type RawVariant = { id: string; price: number; option1_name: string | null; option1_value: string | null; option2_value: string | null }
type RawImage  = { url: string; alt_text: string | null; position: number }

function mapToSearchProduct(p: {
  id: string; handle: string; title: string; tags: string[] | null
  product_variants: unknown; product_images: unknown
}): SearchProduct {
  const rawVariants = p.product_variants as RawVariant[]
  const prices = rawVariants.map(v => Number(v.price))
  const imgs = (p.product_images as RawImage[]).sort((a, b) => a.position - b.position)
  return {
    handle: p.handle,
    title: p.title,
    price: prices.length ? Math.min(...prices) : 0,
    imageUrl: imgs[0]?.url ?? null,
    productId: p.id,
    variants: toCardVariants(rawVariants),
    tags: p.tags ?? [],
  }
}

export async function searchProducts(query: string, limit = 16): Promise<SearchProduct[]> {
  if (query.length < 2) return []

  const supabase = await createClient()
  const q = query.toLowerCase().trim()

  const { data } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('hidden', false)
    .or(`title.ilike.%${q}%,product_type.ilike.%${q}%,tags.cs.{"${q}"}`)
    .order('title')
    .limit(limit)

  return (data ?? []).map(mapToSearchProduct)
}

export async function getSuggestions(limit = 8): Promise<SearchProduct[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('hidden', false)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []).map(mapToSearchProduct)
}
