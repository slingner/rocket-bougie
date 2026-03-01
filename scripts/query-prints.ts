import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SECRET_KEY as string
  )

  const { data, error } = await supabase
    .from('products')
    .select('id, handle, title, tags, product_images(url, position), product_variants(option1_name, option1_value, price)')
    .eq('published', true)
    .contains('tags', ['print'])

  if (error) { console.error(error); process.exit(1) }

  for (const p of data ?? []) {
    const isMini = (p.tags as string[])?.includes('mini-print')
    const img = (p.product_images as any[])?.sort((a: any, b: any) => a.position - b.position)[0]
    const variants = (p.product_variants as any[])?.map((v: any) => `${v.option1_value ?? 'Default'} $${v.price}`).join(' | ')
    console.log(isMini ? '[MINI]' : '[PRINT]', p.handle, '|', variants, '|', img?.url ?? 'no-img')
  }
}

main()
