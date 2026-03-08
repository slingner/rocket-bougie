'use server'

import { createClient } from '@/lib/supabase/server'
import type { CartItem } from '@/lib/cart'

export async function getSavedItems(): Promise<CartItem[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('saved_for_later')
    .select('*')
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false })

  if (!data) return []

  return data.map(row => ({
    variantId: row.variant_id,
    productId: row.product_id,
    handle: row.handle,
    title: row.title,
    variantTitle: row.variant_title,
    price: Number(row.price),
    imageUrl: row.image_url,
    quantity: 1,
    tags: row.tags ?? [],
  }))
}

export async function upsertSavedItem(item: CartItem): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('saved_for_later').upsert({
    user_id: user.id,
    variant_id: item.variantId,
    product_id: item.productId,
    handle: item.handle,
    title: item.title,
    variant_title: item.variantTitle,
    price: item.price,
    image_url: item.imageUrl,
    tags: item.tags,
  }, { onConflict: 'user_id,variant_id' })
}

export async function deleteSavedItem(variantId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('saved_for_later')
    .delete()
    .eq('user_id', user.id)
    .eq('variant_id', variantId)
}
