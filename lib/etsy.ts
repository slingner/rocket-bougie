import { createAdminClient } from '@/lib/supabase/server'
export type { EtsyListing, EtsyListingImage, EtsyListingFull, EtsyInventory, EtsyInventoryProduct, EtsyShippingProfile, EtsyReturnPolicy } from './etsy-utils'
export { etsyPriceToCents, etsyPriceToDecimal } from './etsy-utils'
import type { EtsyListing, EtsyListingFull, EtsyShippingProfile, EtsyReturnPolicy } from './etsy-utils'

const ETSY_API_BASE = 'https://openapi.etsy.com/v3'
const ETSY_KEYSTRING = process.env.ETSY_API_KEYSTRING!
const ETSY_SHARED_SECRET = process.env.ETSY_API_SHARED_SECRET!
const ETSY_SHOP_ID = process.env.ETSY_SHOP_ID!

const TOKEN_KEYS = {
  access: 'etsy_access_token',
  refresh: 'etsy_refresh_token',
  expiresAt: 'etsy_token_expires_at',
  pkceVerifier: 'etsy_pkce_verifier',
} as const

export async function getStoredTokens(): Promise<{
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null
}> {
  const db = createAdminClient()
  const { data } = await db
    .from('app_settings')
    .select('key, value')
    .in('key', [TOKEN_KEYS.access, TOKEN_KEYS.refresh, TOKEN_KEYS.expiresAt])

  const map: Record<string, string> = {}
  for (const row of data ?? []) map[row.key] = row.value

  return {
    accessToken: map[TOKEN_KEYS.access] ?? null,
    refreshToken: map[TOKEN_KEYS.refresh] ?? null,
    expiresAt: map[TOKEN_KEYS.expiresAt] ? Number(map[TOKEN_KEYS.expiresAt]) : null,
  }
}

export async function saveTokens(accessToken: string, refreshToken: string, expiresAt: number) {
  const db = createAdminClient()
  const now = new Date().toISOString()
  await db.from('app_settings').upsert([
    { key: TOKEN_KEYS.access, value: accessToken, updated_at: now },
    { key: TOKEN_KEYS.refresh, value: refreshToken, updated_at: now },
    { key: TOKEN_KEYS.expiresAt, value: String(expiresAt), updated_at: now },
  ])
}

export { TOKEN_KEYS }

export async function isEtsyConnected(): Promise<boolean> {
  const { accessToken } = await getStoredTokens()
  return !!accessToken
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const resp = await fetch('https://api.etsy.com/v3/public/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: ETSY_KEYSTRING,
      refresh_token: refreshToken,
    }),
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Etsy token refresh failed: ${text}`)
  }

  const json = await resp.json()
  const expiresAt = Date.now() + json.expires_in * 1000
  await saveTokens(json.access_token, json.refresh_token ?? refreshToken, expiresAt)
  return json.access_token
}

function authHeaders(accessToken: string, extra: HeadersInit = {}): Record<string, string> {
  return {
    'x-api-key': `${ETSY_KEYSTRING}:${ETSY_SHARED_SECRET}`,
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    ...(extra as Record<string, string>),
  }
}

function authHeadersNoContentType(accessToken: string): Record<string, string> {
  return {
    'x-api-key': `${ETSY_KEYSTRING}:${ETSY_SHARED_SECRET}`,
    Authorization: `Bearer ${accessToken}`,
  }
}

async function etsyFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const tokens = await getStoredTokens()
  if (!tokens.accessToken) throw new Error('Etsy not connected')

  let accessToken = tokens.accessToken
  if (tokens.expiresAt && Date.now() > tokens.expiresAt - 60_000) {
    if (!tokens.refreshToken) throw new Error('No Etsy refresh token')
    accessToken = await refreshAccessToken(tokens.refreshToken)
  }

  const resp = await fetch(`${ETSY_API_BASE}${path}`, {
    ...options,
    headers: authHeaders(accessToken, options.headers),
  })

  if (resp.status === 401 && tokens.refreshToken) {
    const freshToken = await refreshAccessToken(tokens.refreshToken)
    return fetch(`${ETSY_API_BASE}${path}`, {
      ...options,
      headers: authHeaders(freshToken, options.headers),
    })
  }

  return resp
}

export async function getShopListings(state: 'active' | 'inactive' | 'draft' = 'active'): Promise<EtsyListing[]> {
  if (!ETSY_SHOP_ID) throw new Error('ETSY_SHOP_ID not set')

  const params = new URLSearchParams({ state, limit: '100', includes: 'Images' })
  const resp = await etsyFetch(`/application/shops/${ETSY_SHOP_ID}/listings?${params}`)
  if (!resp.ok) throw new Error(`Failed to fetch listings: ${await resp.text()}`)

  const json = await resp.json()
  return json.results ?? []
}

export async function getListing(listingId: string | number): Promise<EtsyListingFull> {
  const resp = await etsyFetch(`/application/listings/${listingId}?includes=Images,Inventory`)
  if (!resp.ok) throw new Error(`Failed to fetch listing ${listingId}: ${await resp.text()}`)
  return resp.json()
}

export async function updateListing(
  listingId: string | number,
  data: Partial<{ title: string; description: string; price: number; tags: string[]; state: string }>
): Promise<EtsyListing> {
  if (!ETSY_SHOP_ID) throw new Error('ETSY_SHOP_ID not set')

  const resp = await etsyFetch(`/application/shops/${ETSY_SHOP_ID}/listings/${listingId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  if (!resp.ok) throw new Error(`Failed to update listing ${listingId}: ${await resp.text()}`)
  return resp.json()
}

export async function getShippingProfileById(profileId: number): Promise<EtsyShippingProfile | null> {
  if (!ETSY_SHOP_ID) throw new Error('ETSY_SHOP_ID not set')
  const resp = await etsyFetch(`/application/shops/${ETSY_SHOP_ID}/shipping-profiles/${profileId}`)
  if (!resp.ok) return null
  return resp.json()
}

export async function getShippingProfiles(): Promise<EtsyShippingProfile[]> {
  if (!ETSY_SHOP_ID) throw new Error('ETSY_SHOP_ID not set')
  const resp = await etsyFetch(`/application/shops/${ETSY_SHOP_ID}/shipping-profiles`)
  if (!resp.ok) throw new Error(`Failed to fetch shipping profiles: ${await resp.text()}`)
  const json = await resp.json()
  return json.results ?? []
}

export async function getReturnPolicies(): Promise<EtsyReturnPolicy[]> {
  if (!ETSY_SHOP_ID) throw new Error('ETSY_SHOP_ID not set')
  const resp = await etsyFetch(`/application/shops/${ETSY_SHOP_ID}/policies/return`)
  if (!resp.ok) throw new Error(`Failed to fetch return policies: ${await resp.text()}`)
  const json = await resp.json()
  return json.results ?? []
}

export async function createListing(data: {
  title: string
  description: string
  price: number
  quantity: number
  who_made: 'i_did' | 'someone_else' | 'collective'
  when_made: string
  taxonomy_id?: number
  shipping_profile_id: number
  return_policy_id?: number
  tags?: string[]
  materials?: string[]
  item_weight?: number
  item_weight_unit?: 'oz' | 'lb' | 'g' | 'kg'
  item_length?: number
  item_width?: number
  item_height?: number
  item_dimensions_unit?: 'in' | 'cm'
}): Promise<{ listing_id: number }> {
  if (!ETSY_SHOP_ID) throw new Error('ETSY_SHOP_ID not set')
  const resp = await etsyFetch(`/application/shops/${ETSY_SHOP_ID}/listings`, {
    method: 'POST',
    body: JSON.stringify({ ...data, state: 'draft', type: 'physical', readiness_state_id: 1399659863843 }),
  })
  if (!resp.ok) throw new Error(`Failed to create listing: ${await resp.text()}`)
  return resp.json()
}

// Maps our option names to Etsy property IDs (verified against taxonomy node 119, 2026-03-25)
const ETSY_OPTION_PROPERTY_MAP: Record<string, number> = {
  frame:   145330288558, // Etsy "Framing" — accepts "Framed" / "Unframed"
  framing: 145330288558,
}
const ETSY_CUSTOM_PROPERTY_IDS = [513, 514] // Custom1, Custom2 — free-form values

type VariantRow = {
  sku?: string | null
  option1_name?: string | null
  option1_value?: string | null
  option2_name?: string | null
  option2_value?: string | null
  option3_name?: string | null
  option3_value?: string | null
  price: number | string
  inventory_quantity?: number | null
}

export async function updateListingInventory(listingId: number, variants: VariantRow[]): Promise<void> {
  // Single default-title variant — listing already has correct price/qty, nothing to do
  if (variants.length === 1 && variants[0].option1_value === 'Default Title') return

  // Collect distinct option names and assign Etsy property IDs
  const optionNames: string[] = []
  for (const v of variants) {
    for (const name of [v.option1_name, v.option2_name, v.option3_name]) {
      if (name && name !== 'Default Title' && !optionNames.includes(name)) {
        optionNames.push(name)
      }
    }
  }

  const optionPropertyId: Record<string, number> = {}
  let customIdx = 0
  for (const name of optionNames) {
    const mapped = ETSY_OPTION_PROPERTY_MAP[name.toLowerCase()]
    optionPropertyId[name] = mapped ?? ETSY_CUSTOM_PROPERTY_IDS[customIdx++]
  }

  const products = variants.map((v) => {
    const propertyValues: { property_id: number; property_name: string; values: string[] }[] = []
    const pairs = [
      [v.option1_name, v.option1_value],
      [v.option2_name, v.option2_value],
      [v.option3_name, v.option3_value],
    ] as [string | null | undefined, string | null | undefined][]

    for (const [name, value] of pairs) {
      if (name && value && value !== 'Default Title' && optionPropertyId[name]) {
        propertyValues.push({ property_id: optionPropertyId[name], property_name: name, values: [value] })
      }
    }

    return {
      sku: v.sku ?? '',
      property_values: propertyValues,
      offerings: [{ price: Number(v.price), quantity: Math.max(Number(v.inventory_quantity) || 0, 1), is_enabled: true, readiness_state_id: 1399659863843 }],
    }
  })

  const priceOnProperty = Object.values(optionPropertyId)

  const resp = await etsyFetch(`/application/listings/${listingId}/inventory`, {
    method: 'PUT',
    body: JSON.stringify({ products, price_on_property: priceOnProperty, quantity_on_property: [] }),
  })
  if (!resp.ok) throw new Error(`Failed to update listing inventory: ${await resp.text()}`)
}

export async function uploadListingImages(listingId: number, imageUrls: string[]): Promise<void> {
  const tokens = await getStoredTokens()
  if (!tokens.accessToken) throw new Error('Etsy not connected')

  let accessToken = tokens.accessToken
  if (tokens.expiresAt && Date.now() > tokens.expiresAt - 60_000) {
    if (!tokens.refreshToken) throw new Error('No Etsy refresh token')
    accessToken = await refreshAccessToken(tokens.refreshToken)
  }

  // Etsy allows max 10 images, rank starts at 1
  const urls = imageUrls.slice(0, 10)
  for (let i = 0; i < urls.length; i++) {
    const imageResp = await fetch(urls[i])
    if (!imageResp.ok) continue
    const blob = await imageResp.blob()

    const form = new FormData()
    form.append('image', blob, `image-${i + 1}.jpg`)
    form.append('rank', String(i + 1))

    const resp = await fetch(`${ETSY_API_BASE}/application/shops/${ETSY_SHOP_ID}/listings/${listingId}/images`, {
      method: 'POST',
      headers: authHeadersNoContentType(accessToken),
      body: form,
    })
    if (!resp.ok) throw new Error(`Failed to upload image ${i + 1}: ${await resp.text()}`)
  }
}

export function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64UrlEncode(array)
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(new Uint8Array(digest))
}

function base64UrlEncode(array: Uint8Array): string {
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}
