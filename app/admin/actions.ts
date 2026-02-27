'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'

// ---- Orders ----

export async function updateOrder(id: string, data: {
  status?: string
  fulfillment_status?: string
  tracking_number?: string
  tracking_url?: string
}) {
  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('orders')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/orders/${id}`)
  revalidatePath('/admin/orders')
}

// ---- Products ----

export async function togglePublished(id: string, published: boolean) {
  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('products')
    .update({ published, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/products')
}

export async function updateProduct(id: string, data: {
  title?: string
  handle?: string
  description?: string
  product_type?: string
  tags?: string[]
  published?: boolean
  seo_title?: string
  seo_description?: string
}) {
  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('products')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/products/${id}`)
  revalidatePath('/admin/products')
}

export async function createProduct(data: {
  title: string
  handle: string
  description?: string
  product_type?: string
  tags?: string[]
  published?: boolean
  seo_title?: string
  seo_description?: string
}) {
  const supabase = await createAdminClient()
  const { data: product, error } = await supabase
    .from('products')
    .insert(data)
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/admin/products')
  return product
}

export async function upsertVariants(
  productId: string,
  variants: Array<{
    id?: string
    option1_name?: string
    option1_value?: string
    option2_name?: string
    option2_value?: string
    price: number
    compare_at_price?: number | null
    sku?: string
    inventory_quantity?: number
    inventory_policy?: string
  }>
) {
  const supabase = await createAdminClient()

  // Delete variants not in the new list
  const keepIds = variants.filter(v => v.id).map(v => v.id!)
  if (keepIds.length > 0) {
    await supabase
      .from('product_variants')
      .delete()
      .eq('product_id', productId)
      .not('id', 'in', `(${keepIds.join(',')})`)
  } else {
    // No existing variants to keep — delete all
    await supabase
      .from('product_variants')
      .delete()
      .eq('product_id', productId)
  }

  // Upsert each variant
  for (const v of variants) {
    if (v.id) {
      const { id, ...fields } = v
      await supabase
        .from('product_variants')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('id', id)
    } else {
      await supabase
        .from('product_variants')
        .insert({ ...v, product_id: productId })
    }
  }

  revalidatePath(`/admin/products/${productId}`)
}

export async function deleteVariant(id: string, productId: string) {
  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('product_variants')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/products/${productId}`)
}

export async function deleteImage(id: string, productId: string) {
  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('product_images')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/products/${productId}`)
}

export async function addProductImage(productId: string, url: string, position: number) {
  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('product_images')
    .insert({ product_id: productId, url, position })
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/products/${productId}`)
}

export async function uploadProductImage(productId: string, formData: FormData): Promise<string> {
  const supabase = await createAdminClient()
  const file = formData.get('file') as File
  if (!file) throw new Error('No file provided')

  const ext = file.name.split('.').pop() ?? 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const path = `products/${productId}/${filename}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (uploadError) throw new Error(uploadError.message)

  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(path)

  // Get current max position
  const { data: existing } = await supabase
    .from('product_images')
    .select('position')
    .eq('product_id', productId)
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = (existing?.[0]?.position ?? 0) + 1

  const { error: insertError } = await supabase
    .from('product_images')
    .insert({ product_id: productId, url: publicUrl, position: nextPosition })

  if (insertError) throw new Error(insertError.message)

  revalidatePath(`/admin/products/${productId}`)
  return publicUrl
}

// ---- Tags ----

export async function getAllTags(): Promise<string[]> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('products')
    .select('tags')
  const tagSet = new Set<string>()
  for (const row of data ?? []) {
    for (const t of row.tags ?? []) tagSet.add(t)
  }
  return Array.from(tagSet).sort()
}

export async function renameTag(oldTag: string, newTag: string) {
  const supabase = await createAdminClient()
  const trimmed = newTag.trim()
  if (!trimmed || trimmed === oldTag) return

  const { data: products } = await supabase
    .from('products')
    .select('id, tags')
    .contains('tags', [oldTag])

  for (const product of products ?? []) {
    const updatedTags = (product.tags as string[]).map(t => t === oldTag ? trimmed : t)
    await supabase.from('products').update({ tags: updatedTags }).eq('id', product.id)
  }
  revalidatePath('/admin/tags')
  revalidatePath('/admin/products')
}

export async function deleteTag(tag: string) {
  const supabase = await createAdminClient()
  const { data: products } = await supabase
    .from('products')
    .select('id, tags')
    .contains('tags', [tag])

  for (const product of products ?? []) {
    const updatedTags = (product.tags as string[]).filter(t => t !== tag)
    await supabase.from('products').update({ tags: updatedTags }).eq('id', product.id)
  }
  revalidatePath('/admin/tags')
  revalidatePath('/admin/products')
}

// ---- Inventory ----

export async function updateInventoryQuantity(variantId: string, quantity: number) {
  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('product_variants')
    .update({ inventory_quantity: quantity, updated_at: new Date().toISOString() })
    .eq('id', variantId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/inventory')
}

export async function bulkUpdateInventory(updates: Array<{ id: string; inventory_quantity: number }>) {
  const supabase = await createAdminClient()
  for (const { id, inventory_quantity } of updates) {
    await supabase
      .from('product_variants')
      .update({ inventory_quantity, updated_at: new Date().toISOString() })
      .eq('id', id)
  }
  revalidatePath('/admin/inventory')
}
