import { createClient } from '@/lib/supabase/server'

export type SearchProduct = {
  handle: string
  title: string
  price: number
  imageUrl: string | null
}

export async function searchProducts(query: string, limit = 16): Promise<SearchProduct[]> {
  if (query.length < 2) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('handle, title, product_variants(price), product_images(url, alt_text, position)')
    .eq('published', true)
    .ilike('title', `%${query}%`)
    .order('title')
    .limit(limit)

  return (data ?? []).map((p) => {
    const prices = (p.product_variants as { price: number }[]).map((v) => Number(v.price))
    const minPrice = prices.length ? Math.min(...prices) : 0
    const images = p.product_images as { url: string; alt_text: string | null; position: number }[]
    const cover = images.sort((a, b) => a.position - b.position)[0] ?? null
    return {
      handle: p.handle,
      title: p.title,
      price: minPrice,
      imageUrl: cover?.url ?? null,
    }
  })
}
