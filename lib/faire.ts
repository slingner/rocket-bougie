// Faire API client
// Uses OAuth tokens — requires X-FAIRE-APP-CREDENTIALS + X-FAIRE-OAUTH-ACCESS-TOKEN headers

const BASE_URL = 'https://www.faire.com/external-api/v2'

function faireHeaders() {
  const appId = process.env.FAIRE_APPLICATION_ID!
  const appSecret = process.env.FAIRE_APPLICATION_SECRET!
  const accessToken = process.env.FAIRE_ACCESS_TOKEN!
  const credentials = Buffer.from(`${appId}:${appSecret}`).toString('base64')
  return {
    'Content-Type': 'application/json',
    'X-FAIRE-APP-CREDENTIALS': credentials,
    'X-FAIRE-OAUTH-ACCESS-TOKEN': accessToken,
  }
}

async function faireRequest(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...faireHeaders(), ...options.headers },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Faire API error ${res.status} on ${path}: ${body}`)
  }
  return res.json()
}

// ---- Types -------------------------------------------------------

export type FaireImage = {
  id: string
  url: string
  sequence: number
  tags?: string[]
}

export type FaireVariant = {
  id: string
  sku: string
  available_quantity: number
  options: { name: string; value: string }[]
}

export type FaireProduct = {
  id: string
  name: string
  short_description?: string
  description?: string
  lifecycle_state: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'DELETED'
  variants: FaireVariant[]
  images: FaireImage[]
}

// ---- Product fetching --------------------------------------------

export async function getFaireProduct(faireProductId: string): Promise<FaireProduct> {
  return faireRequest(`/products/${faireProductId}`)
}

export async function listFaireProducts(): Promise<FaireProduct[]> {
  const products: FaireProduct[] = []
  let cursor: string | undefined

  while (true) {
    const path = cursor
      ? `/products?limit=50&cursor=${encodeURIComponent(cursor)}`
      : '/products?limit=50'

    const data = await faireRequest(path) as {
      products: FaireProduct[]
      cursor?: string
      page: number
    }

    products.push(...data.products)

    if (!data.cursor || data.cursor === cursor || data.products.length < 50) break
    cursor = data.cursor
  }

  return products
}

// ---- Product updates ---------------------------------------------

export async function updateFaireProduct(
  faireProductId: string,
  updates: {
    name?: string
    images?: { id?: string; url: string; sequence?: number }[]
  }
): Promise<FaireProduct> {
  return faireRequest(`/products/${faireProductId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}

// ---- Inventory updates -------------------------------------------

export async function updateFaireInventoryBySkus(
  updates: Record<string, number>
) {
  return faireRequest('/product-inventory/by-skus', {
    method: 'PATCH',
    body: JSON.stringify({
      inventories: Object.entries(updates).map(([sku, available_quantity]) => ({
        sku, available_quantity,
      })),
    }),
  })
}

export async function updateFaireInventoryByVariantIds(
  updates: Record<string, number>
) {
  return faireRequest('/product-inventory/by-product-variant-ids', {
    method: 'PATCH',
    body: JSON.stringify({
      inventories: Object.entries(updates).map(([product_variant_id, available_quantity]) => ({
        product_variant_id, available_quantity,
      })),
    }),
  })
}
