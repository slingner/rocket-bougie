'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { shippingNotificationHtml, shippingNotificationSubject } from '@/emails/shipping-notification'
import { reviewRequestHtml, reviewRequestSubject } from '@/emails/review-request'
import { getFaireProduct, updateFaireProduct } from '@/lib/faire'

// ---- Orders ----

export async function updateOrder(id: string, data: {
  status?: string
  fulfillment_status?: string
  tracking_number?: string
  tracking_url?: string
}) {
  const supabase = await createAdminClient()

  // Fetch current order state before saving (needed to detect new fulfillment)
  const { data: currentOrder } = await supabase
    .from('orders')
    .select(`
      email, order_number, fulfillment_status, shipping_name,
      shipping_address1, shipping_address2,
      shipping_city, shipping_state, shipping_zip,
      order_items ( id, product_id, title, variant_title, quantity, unit_price, total_price, image_url )
    `)
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('orders')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath(`/admin/orders/${id}`)
  revalidatePath('/admin/orders')

  // Send shipping notification when an order is marked fulfilled for the first time
  const becomingFulfilled =
    data.fulfillment_status === 'fulfilled' &&
    currentOrder?.fulfillment_status !== 'fulfilled'

  if (becomingFulfilled && currentOrder?.email) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: currentOrder.email,
        subject: shippingNotificationSubject(currentOrder.order_number),
        html: shippingNotificationHtml({
          orderNumber: currentOrder.order_number,
          trackingNumber: data.tracking_number || null,
          trackingUrl: data.tracking_url || null,
          items: currentOrder.order_items as {
            title: string
            variant_title: string | null
            quantity: number
            unit_price: number
            total_price: number
          }[],
          shippingName: currentOrder.shipping_name,
          shippingAddress1: currentOrder.shipping_address1,
          shippingAddress2: currentOrder.shipping_address2,
          shippingCity: currentOrder.shipping_city,
          shippingState: currentOrder.shipping_state,
          shippingZip: currentOrder.shipping_zip,
        }),
      })
    } catch (emailErr) {
      console.error('Failed to send shipping notification:', emailErr)
    }

    // Create review tokens for each order item and send review request email
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
        ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://rocketboogie.com')

      const items = currentOrder.order_items as Array<{
        id: string
        product_id: string | null
        title: string
        image_url: string | null
      }>

      // Only create review tokens for items with a product (not deleted products)
      const reviewableItems = items.filter(item => item.product_id)

      const reviewItems: Array<{ productTitle: string; imageUrl: string | null; reviewUrl: string }> = []

      for (const item of reviewableItems) {
        // Skip if a review token already exists for this order item
        const { data: existing } = await supabase
          .from('reviews')
          .select('id')
          .eq('order_item_id', item.id)
          .maybeSingle()

        if (existing) continue

        const token = crypto.randomUUID()

        await supabase.from('reviews').insert({
          product_id: item.product_id,
          order_item_id: item.id,
          customer_email: currentOrder.email,
          customer_name: currentOrder.shipping_name ?? '',
          review_token: token,
        })

        reviewItems.push({
          productTitle: item.title,
          imageUrl: item.image_url,
          reviewUrl: `${siteUrl}/review/${token}`,
        })
      }

      if (reviewItems.length > 0) {
        const sendAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        await resend.emails.send({
          from: FROM_EMAIL,
          to: currentOrder.email,
          subject: reviewRequestSubject(),
          html: reviewRequestHtml(reviewItems),
          scheduledAt: sendAt.toISOString(),
        })
      }
    } catch (reviewErr) {
      console.error('Failed to send review request:', reviewErr)
    }
  }
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
    // No existing variants to keep, delete all
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

// ---- Faire sync ----

export async function syncProductToFaire(productId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createAdminClient()

  const { data: product } = await supabase
    .from('products')
    .select('title, description, faire_product_id')
    .eq('id', productId)
    .single()

  if (!product) return { ok: false, error: 'Product not found' }
  if (!product.faire_product_id) return { ok: false, error: 'Product is not linked to Faire' }

  // Fetch images not yet synced to Faire
  const { data: unsyncedImages } = await supabase
    .from('product_images')
    .select('id, url, position')
    .eq('product_id', productId)
    .eq('synced_to_faire', false)
    .order('position', { ascending: true })

  try {
    // Sync title + descriptions. short_description is capped at 75 chars by Faire.
    const shortDesc = (product.description ?? '').replace(/<[^>]*>/g, '').slice(0, 75)
    await updateFaireProduct(product.faire_product_id, {
      name: product.title,
      short_description: shortDesc,
      description: product.description ?? '',
    })

    // Push each unsynced image one at a time so we can reliably capture its Faire image ID.
    // Fetch the current Faire state once, then track it in memory as we add images.
    if (unsyncedImages && unsyncedImages.length > 0) {
      const faireProduct = await getFaireProduct(product.faire_product_id)
      let currentImages = faireProduct.images.map(i => ({ id: i.id, url: i.url, sequence: i.sequence }))

      for (const img of unsyncedImages) {
        const beforeIds = new Set(currentImages.map(i => i.id))

        const after = await updateFaireProduct(product.faire_product_id, {
          images: [...currentImages, { url: img.url }],
        })

        const newImage = after.images.find(i => !beforeIds.has(i.id))
        currentImages = after.images.map(i => ({ id: i.id, url: i.url, sequence: i.sequence }))

        await supabase
          .from('product_images')
          .update({
            synced_to_faire: true,
            faire_image_id: newImage?.id ?? null,
          })
          .eq('id', img.id)
      }
    }

    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Sync failed' }
  }
}

export async function bulkSyncToFaire(): Promise<{ ok: true; synced: number } | { ok: false; error: string }> {
  const supabase = await createAdminClient()

  const { data: products } = await supabase
    .from('products')
    .select('id')
    .not('faire_product_id', 'is', null)

  if (!products?.length) return { ok: true, synced: 0 }

  const { data: unsyncedImages } = await supabase
    .from('product_images')
    .select('product_id')
    .eq('synced_to_faire', false)
    .in('product_id', products.map(p => p.id))

  const productIds = Array.from(new Set((unsyncedImages ?? []).map(i => i.product_id)))

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

  let synced = 0
  for (const productId of productIds) {
    const result = await syncProductToFaire(productId)
    if (result.ok) synced++
    await sleep(200)
  }

  revalidatePath('/admin/products')
  return { ok: true, synced }
}

export async function refreshFaireSyncStatus(productId: string): Promise<{ ok: true; reset: number } | { ok: false; error: string }> {
  const supabase = await createAdminClient()

  const { data: product } = await supabase
    .from('products')
    .select('faire_product_id')
    .eq('id', productId)
    .single()

  if (!product?.faire_product_id) return { ok: false, error: 'Product is not linked to Faire' }

  try {
    const faireProduct = await getFaireProduct(product.faire_product_id)
    const faireImageIds = new Set(faireProduct.images.map(i => i.id))

    const { data: syncedImages } = await supabase
      .from('product_images')
      .select('id, faire_image_id')
      .eq('product_id', productId)
      .eq('synced_to_faire', true)

    const toReset = (syncedImages ?? []).filter(img =>
      img.faire_image_id && !faireImageIds.has(img.faire_image_id)
    )

    if (toReset.length > 0) {
      await supabase
        .from('product_images')
        .update({ synced_to_faire: false, faire_image_id: null })
        .in('id', toReset.map(img => img.id))
    }

    revalidatePath(`/admin/products/${productId}`)
    return { ok: true, reset: toReset.length }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Refresh failed' }
  }
}

// ---- Tags ----

export async function getAllTypes(): Promise<string[]> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('products')
    .select('product_type')
  return Array.from(
    new Set((data ?? []).map(r => r.product_type).filter(Boolean) as string[])
  ).sort()
}

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

// ---- Discounts ----

export async function createDiscountCode(data: {
  code: string
  type: 'percentage' | 'fixed'
  value: number
  min_order_amount?: number | null
  usage_limit?: number | null
  expires_at?: string | null
  first_time_only?: boolean
}) {
  const supabase = await createAdminClient()
  const code = data.code.trim().toUpperCase()

  // Create Stripe Coupon (underlying discount definition, no usage limit here)
  const stripeCoupon = await stripe.coupons.create(
    data.type === 'percentage'
      ? { percent_off: data.value, duration: 'once', name: code }
      : { amount_off: Math.round(data.value * 100), currency: 'usd', duration: 'once', name: code }
  )

  // Create a Stripe Promotion Code on top of the coupon; this is the customer-facing
  // code that Stripe tracks per-customer redemptions on.
  const stripePromoCode = await stripe.promotionCodes.create({
    promotion: { type: 'coupon', coupon: stripeCoupon.id },
    code,
    ...(data.usage_limit ? { max_redemptions: data.usage_limit } : {}),
    ...(data.expires_at ? { expires_at: Math.floor(new Date(data.expires_at).getTime() / 1000) } : {}),
    ...(data.first_time_only ? { restrictions: { first_time_transaction: true } } : {}),
  })

  const { error } = await supabase.from('discount_codes').insert({
    code,
    type: data.type,
    value: data.value,
    min_order_amount: data.min_order_amount ?? null,
    usage_limit: data.usage_limit ?? null,
    expires_at: data.expires_at ?? null,
    first_time_only: data.first_time_only ?? false,
    stripe_coupon_id: stripeCoupon.id,
    stripe_promotion_code_id: stripePromoCode.id,
  })

  if (error) {
    // Clean up Stripe objects if DB insert fails
    await stripe.promotionCodes.update(stripePromoCode.id, { active: false }).catch(() => {})
    await stripe.coupons.del(stripeCoupon.id).catch(() => {})
    throw new Error(error.message)
  }

  revalidatePath('/admin/discounts')
}

export async function toggleDiscountActive(id: string, active: boolean) {
  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('discount_codes')
    .update({ active })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/discounts')
}

export async function deleteDiscountCode(id: string) {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('discount_codes')
    .select('stripe_coupon_id, stripe_promotion_code_id')
    .eq('id', id)
    .single()

  // Delete from Stripe: deactivate the promo code first, then delete the coupon
  if (data?.stripe_promotion_code_id) {
    await stripe.promotionCodes.update(data.stripe_promotion_code_id, { active: false }).catch(() => {})
  }
  if (data?.stripe_coupon_id) {
    await stripe.coupons.del(data.stripe_coupon_id).catch(() => {})
  }

  const { error } = await supabase.from('discount_codes').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/discounts')
}

// ---- Discount Rules (automatic volume deals) ----

export async function getActiveDiscountRules() {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('discount_rules')
    .select('*')
    .eq('active', true)
    .order('sort_order')
  return data ?? []
}

export async function createDiscountRule(data: {
  name: string
  description?: string | null
  type: 'bundle_price' | 'nth_free' | 'percent_off'
  applies_to_tag?: string | null
  bundle_qty?: number | null
  bundle_price?: number | null
  buy_qty?: number | null
  get_qty?: number | null
  percent_off?: number | null
}) {
  const supabase = await createAdminClient()
  const { error } = await supabase.from('discount_rules').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/discounts')
}

export async function toggleDiscountRule(id: string, active: boolean) {
  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('discount_rules')
    .update({ active })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/discounts')
}

export async function deleteDiscountRule(id: string) {
  const supabase = await createAdminClient()
  const { error } = await supabase.from('discount_rules').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/discounts')
}

// Public: callable from cart page to validate a code before checkout
export async function validateDiscountCode(
  code: string,
  subtotal: number
): Promise<{
  valid: true
  firstTimeOnly: boolean
  id: string
  type: 'percentage' | 'fixed'
  value: number
  discountAmount: number
  stripePromotionCodeId: string
} | { valid: false; error: string }> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .single()

  if (!data) return { valid: false, error: 'Invalid code' }
  if (!data.active) return { valid: false, error: 'This code is no longer active' }
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false, error: 'This code has expired' }
  }
  if (data.usage_limit !== null && data.usage_count >= data.usage_limit) {
    return { valid: false, error: 'This code has reached its usage limit' }
  }
  if (data.min_order_amount !== null && subtotal < Number(data.min_order_amount)) {
    return { valid: false, error: `Minimum order of $${Number(data.min_order_amount).toFixed(2)} required` }
  }

  const discountAmount = data.type === 'percentage'
    ? Math.min(subtotal, Math.round(subtotal * Number(data.value)) / 100)
    : Math.min(subtotal, Number(data.value))

  return {
    valid: true,
    firstTimeOnly: data.first_time_only ?? false,
    id: data.id,
    type: data.type,
    value: Number(data.value),
    discountAmount: Math.round(discountAmount * 100) / 100,
    stripePromotionCodeId: data.stripe_promotion_code_id,
  }
}
