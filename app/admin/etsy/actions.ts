'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { getListing, updateListing, createListing, updateListingInventory, uploadListingImages, etsyPriceToDecimal } from '@/lib/etsy'
import { generateEtsyTagsAndMaterials, stripHtml } from '@/lib/etsy-seo'


// Import an Etsy listing as a new local product
export async function importEtsyListing(listingId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const listing = await getListing(listingId)
    const db = createAdminClient()

    // Check if already imported
    const { data: existing } = await db
      .from('products')
      .select('id')
      .eq('etsy_listing_id', String(listing.listing_id))
      .single()

    if (existing) return { ok: false, error: 'This listing is already imported' }

    // Build a URL-friendly handle from the title
    const handle = listing.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 80)

    // Check handle uniqueness — append listing ID if taken
    const { data: handleExists } = await db
      .from('products')
      .select('id')
      .eq('handle', handle)
      .single()

    const finalHandle = handleExists ? `${handle}-${listing.listing_id}` : handle

    const basePrice = listing.price ? etsyPriceToDecimal(listing.price) : 0

    // Create product
    const { data: product, error: productError } = await db
      .from('products')
      .insert({
        handle: finalHandle,
        title: listing.title,
        description: listing.description ?? '',
        tags: listing.tags ?? [],
        published: listing.state === 'active',
        hidden: false,
        etsy_listing_id: String(listing.listing_id),
      })
      .select('id')
      .single()

    if (productError || !product) {
      return { ok: false, error: productError?.message ?? 'Failed to create product' }
    }

    const inventory = listing.inventory
    const variantRows = inventory?.products?.length
      ? inventory.products.map((inv) => {
          const offering = inv.offerings?.[0]
          const propVal = inv.property_values?.[0]
          return {
            product_id: product.id,
            option1_name: propVal?.property_name ?? null,
            option1_value: propVal?.values?.[0] ?? null,
            price: offering ? etsyPriceToDecimal(offering.price) : basePrice,
            inventory_quantity: offering?.quantity ?? 0,
            inventory_policy: 'deny',
            requires_shipping: true,
            taxable: true,
          }
        })
      : [{
          product_id: product.id,
          option1_name: null,
          option1_value: 'Default Title',
          price: basePrice,
          inventory_quantity: listing.quantity ?? 0,
          inventory_policy: 'deny',
          requires_shipping: true,
          taxable: true,
        }]

    await db.from('product_variants').insert(variantRows)

    // Import images
    if (listing.images?.length) {
      const imageRows = listing.images
        .sort((a, b) => a.rank - b.rank)
        .map((img, i) => ({
          product_id: product.id,
          url: img.url_fullxfull,
          position: i + 1,
          alt_text: listing.title,
        }))
      await db.from('product_images').insert(imageRows)
    }

    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// Link an existing local product to an Etsy listing
export async function linkProductToEtsyListing(
  productId: string,
  listingId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const db = createAdminClient()
    const { error } = await db
      .from('products')
      .update({ etsy_listing_id: listingId })
      .eq('id', productId)

    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// Push local product changes to Etsy
export async function syncProductToEtsy(
  productId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const db = createAdminClient()

    const { data: product, error } = await db
      .from('products')
      .select('*, product_variants(*)')
      .eq('id', productId)
      .single()

    if (error || !product) return { ok: false, error: 'Product not found' }
    if (!product.etsy_listing_id) return { ok: false, error: 'No Etsy listing linked' }

    const variants = product.product_variants ?? []
    // Use lowest price across variants
    const price = variants.length > 0 ? Math.min(...variants.map((v: { price: number }) => v.price)) : null

    await updateListing(product.etsy_listing_id, {
      title: product.title,
      description: stripHtml(product.description ?? ''),
      ...(price !== null ? { price } : {}),
      tags: (product.tags ?? []).slice(0, ETSY_MAX_TAGS),
    })

    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// Pull Etsy listing details into a local product (title, description, price, tags)
export async function pullFromEtsy(
  productId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const db = createAdminClient()

    const { data: product, error } = await db
      .from('products')
      .select('id, etsy_listing_id, product_variants(*)')
      .eq('id', productId)
      .single()

    if (error || !product) return { ok: false, error: 'Product not found' }
    if (!product.etsy_listing_id) return { ok: false, error: 'No Etsy listing linked' }

    const listing = await getListing(product.etsy_listing_id)

    // Update local product
    await db.from('products').update({
      title: listing.title,
      description: listing.description ?? '',
      tags: listing.tags ?? [],
    }).eq('id', productId)

    // Update price on variants if it changed
    const newPrice = listing.price ? etsyPriceToDecimal(listing.price) : null
    if (newPrice !== null && product.product_variants?.length) {
      // Only update variants that have a single price (not multi-variant with different prices)
      const variants = product.product_variants as { id: string; price: number }[]
      const allSamePrice = variants.every((v) => v.price === variants[0].price)
      if (allSamePrice) {
        await db.from('product_variants')
          .update({ price: newPrice })
          .eq('product_id', productId)
      }
    }

    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// Create a new Etsy draft listing from a local product
export async function publishProductToEtsy(
  productId: string,
  opts: {
    shipping_profile_id: number
    when_made: string
    taxonomy_id?: number
    return_policy_id?: number
  }
): Promise<{ ok: true; listing_id: number; warning?: string } | { ok: false; error: string }> {
  try {
    const db = createAdminClient()

    const { data: product, error } = await db
      .from('products')
      .select('*, product_variants(*)')
      .eq('id', productId)
      .single()

    if (error || !product) return { ok: false, error: `Product not found: ${error?.message ?? ''}` }

    const { data: productImages } = await db
      .from('product_images')
      .select('url, position')
      .eq('product_id', productId)
      .order('position', { ascending: true })
    if (product.etsy_listing_id) return { ok: false, error: 'Already linked to an Etsy listing' }

    const variants = (product.product_variants ?? []) as {
      sku?: string | null
      price: number
      inventory_quantity?: number | null
      option1_name?: string | null; option1_value?: string | null
      option2_name?: string | null; option2_value?: string | null
      option3_name?: string | null; option3_value?: string | null
    }[]
    const price = variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : 0
    const quantity = variants.reduce((sum, v) => sum + (v.inventory_quantity ?? 0), 0)

    if (!price) return { ok: false, error: 'Product has no price set' }

    const { tags, materials } = await generateEtsyTagsAndMaterials(
      product.title,
      product.product_type ?? '',
      product.tags ?? [],
      product.description ?? '',
    )

    const { listing_id } = await createListing({
      title: product.title,
      description: stripHtml(product.description ?? ''),
      price,
      quantity: Math.max(quantity, 1),
      who_made: 'i_did',
      when_made: opts.when_made,
      taxonomy_id: opts.taxonomy_id,
      shipping_profile_id: opts.shipping_profile_id,
      return_policy_id: opts.return_policy_id,
      tags,
      materials,
    })

    await updateListingInventory(listing_id, variants)

    const images = (productImages ?? []).map((img) => img.url)
    let imageWarning: string | undefined
    if (images.length > 0) {
      try {
        await uploadListingImages(listing_id, images)
      } catch (imgErr) {
        imageWarning = `Listing created (id: ${listing_id}) but images failed to upload: ${imgErr instanceof Error ? imgErr.message : String(imgErr)}`
        console.error('[etsy] image upload failed:', imgErr)
      }
    }

    await db.from('products').update({ etsy_listing_id: String(listing_id) }).eq('id', productId)

    return { ok: true, listing_id, warning: imageWarning }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function unlinkEtsyListing(productId: string): Promise<void> {
  const db = createAdminClient()
  await db.from('products').update({ etsy_listing_id: null }).eq('id', productId)
}

// Fetch local products without an Etsy listing (for the "link" dropdown)
export async function getUnlinkedLocalProducts(): Promise<{ id: string; title: string; handle: string }[]> {
  const db = createAdminClient()
  const { data } = await db
    .from('products')
    .select('id, title, handle')
    .is('etsy_listing_id', null)
    .eq('hidden', false)
    .order('title')
    .limit(500)

  return data ?? []
}
