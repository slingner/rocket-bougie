import { createAdminClient } from '@/lib/supabase/server'

// Product catalog feed for Pinterest (Ads → Catalogs → data source URL).
// Pinterest re-downloads this on a schedule, so it always reflects the current
// products, prices and stock in Supabase. One row per variant; variants of the
// same product share item_group_id.

export const revalidate = 3600 // rebuild at most once an hour

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rocketboogie.com'

const COLUMNS = [
  'id',
  'item_group_id',
  'title',
  'description',
  'link',
  'image_link',
  'additional_image_link',
  'price',
  'sale_price',
  'availability',
  'condition',
  'brand',
  'product_type',
] as const

interface Variant {
  id: string
  sku: string | null
  option1_name: string | null
  option1_value: string | null
  option2_value: string | null
  option3_value: string | null
  price: number
  compare_at_price: number | null
  inventory_quantity: number | null
  inventory_policy: string
  image_id: string | null
}

interface Image {
  id: string
  url: string
  position: number
}

function csvCell(value: string) {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

function stripHtml(html: string | null) {
  return (html ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function money(amount: number) {
  return `${Number(amount).toFixed(2)} USD`
}

export async function GET() {
  const supabase = createAdminClient()

  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id,
      handle,
      title,
      description,
      seo_description,
      product_type,
      thumbnail_image_id,
      product_variants (
        id, sku, option1_name, option1_value, option2_value, option3_value,
        price, compare_at_price, inventory_quantity, inventory_policy, image_id
      ),
      product_images!product_images_product_id_fkey ( id, url, position )
    `)
    .eq('hidden', false)
    .neq('fulfillment_service', 'gift_card')

  if (error) {
    console.error('Pinterest feed query failed:', error)
    return new Response('Feed unavailable', { status: 500 })
  }

  const rows: string[] = [COLUMNS.join(',')]

  for (const product of products ?? []) {
    const images = [...((product.product_images ?? []) as Image[])].sort((a, b) => a.position - b.position)
    if (images.length === 0) continue // Pinterest requires an image

    const mainImage = product.thumbnail_image_id
      ? (images.find((img) => img.id === product.thumbnail_image_id) ?? images[0])
      : images[0]
    const description =
      stripHtml(product.description) || stripHtml(product.seo_description) || product.title

    for (const v of (product.product_variants ?? []) as Variant[]) {
      // "Default Title" is the placeholder for products without real options
      const options = v.option1_name === 'Title'
        ? []
        : [v.option1_value, v.option2_value, v.option3_value].filter(Boolean)
      const title = options.length ? `${product.title} - ${options.join(' / ')}` : product.title

      const variantImage = v.image_id ? images.find((img) => img.id === v.image_id) : undefined
      const image = variantImage ?? mainImage
      const additionalImages = images
        .filter((img) => img.id !== image.id)
        .slice(0, 10)
        .map((img) => img.url)
        .join(',')

      const onSale = v.compare_at_price != null && Number(v.compare_at_price) > Number(v.price)
      const inStock = v.inventory_policy === 'continue' || (v.inventory_quantity ?? 0) > 0

      const row: Record<(typeof COLUMNS)[number], string> = {
        id: v.id, // matches product_id sent by the Pinterest Tag and Conversions API
        item_group_id: product.id,
        title: title.slice(0, 500),
        description: description.slice(0, 10000),
        link: `${siteUrl}/products/${product.handle}`,
        image_link: image.url,
        additional_image_link: additionalImages,
        price: money(onSale ? Number(v.compare_at_price) : v.price),
        sale_price: onSale ? money(v.price) : '',
        availability: inStock ? 'in stock' : 'out of stock',
        condition: 'new',
        brand: 'Rocket Boogie Co.',
        product_type: product.product_type ?? '',
      }

      rows.push(COLUMNS.map((col) => csvCell(row[col])).join(','))
    }
  }

  return new Response(rows.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/csv; charset=utf-8' },
  })
}
