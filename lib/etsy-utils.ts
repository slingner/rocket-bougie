// Pure utilities and types — no server imports, safe to use in client components

export interface EtsyListing {
  listing_id: number
  title: string
  description: string
  state: 'active' | 'inactive' | 'draft' | 'sold_out' | 'expired' | 'edit'
  quantity: number
  price: { amount: number; divisor: number; currency_code: string }
  tags: string[]
  images?: EtsyListingImage[]
  url: string
  creation_timestamp: number
}

export interface EtsyListingImage {
  listing_image_id: number
  url_570xN: string
  url_fullxfull: string
  rank: number
}

export interface EtsyListingFull extends EtsyListing {
  inventory?: EtsyInventory
}

export interface EtsyInventory {
  products: EtsyInventoryProduct[]
  price_on_property: number[]
  quantity_on_property: number[]
}

export interface EtsyInventoryProduct {
  product_id: number
  sku: string
  property_values: { property_id: number; property_name: string; values: string[] }[]
  offerings: { offering_id: number; quantity: number; price: { amount: number; divisor: number; currency_code: string }; is_enabled: boolean }[]
}

export interface EtsyShippingProfile {
  shipping_profile_id: number
  title: string
}

export interface EtsyReturnPolicy {
  return_policy_id: number
  accepts_returns: boolean
  accepts_exchanges: boolean
}

export function etsyPriceToCents(price: { amount: number; divisor: number }): number {
  return Math.round((price.amount / price.divisor) * 100)
}

export function etsyPriceToDecimal(price: { amount: number; divisor: number }): number {
  return price.amount / price.divisor
}
