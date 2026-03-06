const SHIPPO_BASE = 'https://api.goshippo.com'

async function shippoFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${SHIPPO_BASE}${path}`, {
    ...options,
    headers: {
      'Authorization': `ShippoToken ${process.env.SHIPPO_API_KEY}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Shippo ${res.status}: ${text}`)
  }
  return res.json()
}

export type ShippoRate = {
  object_id: string
  provider: string
  servicelevel: { name: string; token: string }
  amount: string
  currency: string
  estimated_days: number | null
  duration_terms: string | null
}

export type ShippoTransaction = {
  status: string
  tracking_number: string
  tracking_url_provider: string
  label_url: string
  messages: Array<{ text: string }>
}

export function fromAddress() {
  return {
    name: process.env.SHIPPO_FROM_NAME ?? 'Rocket Boogie Co.',
    street1: process.env.SHIPPO_FROM_STREET1!,
    city: process.env.SHIPPO_FROM_CITY!,
    state: process.env.SHIPPO_FROM_STATE!,
    zip: process.env.SHIPPO_FROM_ZIP!,
    country: 'US',
    phone: process.env.SHIPPO_FROM_PHONE ?? '',
  }
}

export async function getRates(params: {
  toName: string
  toStreet1: string
  toStreet2?: string | null
  toCity: string
  toState: string
  toZip: string
  toCountry: string
  weightLb: number
  lengthIn: number
  widthIn: number
  heightIn: number
}): Promise<ShippoRate[]> {
  const shipment = await shippoFetch<{ rates: ShippoRate[] }>('/shipments', {
    method: 'POST',
    body: JSON.stringify({
      address_from: fromAddress(),
      address_to: {
        name: params.toName,
        street1: params.toStreet1,
        street2: params.toStreet2 ?? '',
        city: params.toCity,
        state: params.toState,
        zip: params.toZip,
        country: params.toCountry,
      },
      parcels: [{
        length: String(params.lengthIn),
        width: String(params.widthIn),
        height: String(params.heightIn),
        distance_unit: 'in',
        weight: String(params.weightLb),
        mass_unit: 'lb',
      }],
      async: false,
    }),
  })
  return shipment.rates ?? []
}

export async function purchaseLabel(rateId: string): Promise<ShippoTransaction> {
  return shippoFetch<ShippoTransaction>('/transactions', {
    method: 'POST',
    body: JSON.stringify({
      rate: rateId,
      label_file_type: 'PDF',
      async: false,
    }),
  })
}
