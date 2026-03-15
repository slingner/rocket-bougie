// Shipping360 API (SendPro360)
const SANDBOX_BASE = 'https://api-sandbox.sendpro360.pitneybowes.com/shipping'
const PROD_BASE = 'https://api.sendpro360.pitneybowes.com/shipping'

const BASE_URL = process.env.PITNEY_BOWES_SANDBOX === 'false' ? PROD_BASE : SANDBOX_BASE

const SANDBOX_AUTH = 'https://api-sandbox.sendpro360.pitneybowes.com/auth/api/v1/token'
const PROD_AUTH = 'https://api.sendpro360.pitneybowes.com/auth/api/v1/token'
const AUTH_URL = process.env.PITNEY_BOWES_SANDBOX === 'false' ? PROD_AUTH : SANDBOX_AUTH

// Module-level token cache (reused across requests in the same process)
let cachedToken: { value: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  const now = Date.now()
  if (cachedToken && now < cachedToken.expiresAt - 60_000) {
    return cachedToken.value
  }

  const key = process.env.PITNEY_BOWES_API_KEY
  const secret = process.env.PITNEY_BOWES_API_SECRET
  if (!key || !secret) throw new Error('PITNEY_BOWES_API_KEY and PITNEY_BOWES_API_SECRET are required')

  const credentials = Buffer.from(`${key}:${secret}`).toString('base64')

  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Pitney Bowes auth failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  const expiresIn = Number(data.expires_in ?? 14400) * 1000
  cachedToken = { value: data.access_token, expiresAt: now + expiresIn }
  return cachedToken.value
}

async function pbFetch<T>(path: string, body: unknown, method = 'POST'): Promise<T> {
  const token = await getAccessToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept-Language': 'en-US',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Pitney Bowes ${res.status}: ${text}`)
  }
  return res.json()
}

// Maps service IDs to human-readable names
const SERVICE_NAMES: Record<string, string> = {
  // USPS
  FCM: 'First-Class Mail',
  FCPS: 'First-Class Package Service',
  PM: 'Priority Mail',
  PME: 'Priority Mail Express',
  EMI: 'Priority Mail Express International',
  PRCLSEL: 'Parcel Select',
  PRCLSELLW: 'Parcel Select Lightweight',
  EM: 'Express Mail',
  MM: 'Media Mail',
  LIB: 'Library Mail',
  MEDIA: 'Media Mail',
  BPM: 'Bound Printed Matter',
  UGA: 'USPS Ground Advantage',
  UGAM: 'USPS Ground Advantage Machinable',
  // UPS
  GRD: 'UPS Ground',
  '3DA': 'UPS 3-Day Select',
  '2DA': 'UPS 2nd Day Air',
  NDA: 'UPS Next Day Air',
  NDA_AM: 'UPS Next Day Air Early',
  NDA_SVR: 'UPS Next Day Air Saver',
  // FedEx
  '2DA_AM': 'FedEx 2Day AM',
}

export type PBRate = {
  id: string
  carrier: string
  serviceId: string
  parcelType: string
  carrierAccount: string
  serviceName: string
  totalCharge: number
  currency: string
  estimatedDays: string | null
  estimatedDelivery: string | null
}

export async function getPBRates(params: {
  fromZip: string
  fromStreet1?: string
  toZip: string
  toCountry: string
  weightLb: number
  lengthIn: number
  widthIn: number
  heightIn: number
  parcelType?: string
}): Promise<PBRate[]> {
  // rateShop: no carrierAccounts needed — returns all onboarded carriers
  const data = await pbFetch<{
    rates?: Array<{
      carrier: string
      serviceId: string
      parcelType: string
      carrierAccount: string
      rateTypeId?: string
      totalCarrierCharge: number
      currencyCode: string
    }>
    errors?: Array<{ code: string; message: string }>
  }>('/api/v1/rates', {
    fromAddress: {
      addressLine1: params.fromStreet1 ?? process.env.SHIPPO_FROM_STREET1 ?? '',
      postalCode: params.fromZip,
      countryCode: 'US',
    },
    toAddress: {
      addressLine1: params.toZip,
      postalCode: params.toZip,
      countryCode: params.toCountry,
    },
    ...(params.parcelType ? { parcelType: params.parcelType } : {}),
    parcel: {
      weight: Math.round(params.weightLb * 16 * 100) / 100,
      weightUnit: 'OZ',
      length: params.lengthIn,
      width: params.widthIn,
      height: params.heightIn,
      dimUnit: 'IN',
    },
  })

  const rawRates = data.rates ?? []

  const mapped: PBRate[] = rawRates.map((r, i) => ({
    id: `pb-${r.carrier}-${r.serviceId}-${r.rateTypeId ?? i}`,
    carrier: r.carrier.toUpperCase(),
    serviceId: r.serviceId,
    parcelType: r.parcelType ?? 'PKG',
    carrierAccount: r.carrierAccount,
    serviceName: SERVICE_NAMES[r.serviceId] ?? r.serviceId,
    totalCharge: r.totalCarrierCharge,
    currency: r.currencyCode ?? 'USD',
    estimatedDays: null,
    estimatedDelivery: null,
  }))

  // Keep only cheapest rate per service
  const cheapestByService = new Map<string, PBRate>()
  for (const rate of mapped) {
    const key = `${rate.carrier}-${rate.serviceId}`
    const existing = cheapestByService.get(key)
    if (!existing || rate.totalCharge < existing.totalCharge) {
      cheapestByService.set(key, rate)
    }
  }

  return [...cheapestByService.values()].sort((a, b) => a.totalCharge - b.totalCharge)
}

export type PBTransaction = {
  shipmentId: string
  trackingNumber: string
  labelUrl: string
}

export async function purchasePBLabel(params: {
  fromName: string
  fromStreet1: string
  fromCity: string
  fromState: string
  fromZip: string
  fromPhone: string
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
  carrier: string
  serviceId: string
  parcelType: string
  carrierAccount: string
}): Promise<PBTransaction> {
  const carrierAccountId =
    params.carrierAccount || process.env.PITNEY_BOWES_CARRIER_ACCOUNT_ID
  if (!carrierAccountId) {
    throw new Error('carrierAccount or PITNEY_BOWES_CARRIER_ACCOUNT_ID is required')
  }

  const data = await pbFetch<{
    shipmentId: string
    parcelTrackingNumber: string
    labelLayout?: Array<{ contentType: string; contents: string; type: string }>
  }>('/api/v1/shipments', {
    size: 'DOC_4X6',
    type: 'SHIPPING_LABEL',
    format: 'PDF',
    fromAddress: {
      name: params.fromName,
      addressLine1: params.fromStreet1,
      cityTown: params.fromCity,
      stateProvince: params.fromState,
      postalCode: params.fromZip,
      countryCode: 'US',
      phone: params.fromPhone,
    },
    toAddress: {
      name: params.toName,
      addressLine1: params.toStreet1,
      ...(params.toStreet2 ? { addressLine2: params.toStreet2 } : {}),
      cityTown: params.toCity,
      stateProvince: params.toState,
      postalCode: params.toZip,
      countryCode: params.toCountry,
    },
    parcel: {
      weight: Math.round(params.weightLb * 16 * 100) / 100,
      weightUnit: 'OZ',
      length: params.lengthIn,
      width: params.widthIn,
      height: params.heightIn,
      dimUnit: 'IN',
    },
    carrierAccountId,
    serviceId: params.serviceId,
    parcelType: params.parcelType,
  })

  const labelDoc = data.labelLayout?.find(d => d.type === 'SHIPPING_LABEL')
  if (!labelDoc?.contents) throw new Error('Pitney Bowes returned no label URL')

  return {
    shipmentId: data.shipmentId,
    trackingNumber: data.parcelTrackingNumber,
    labelUrl: labelDoc.contents,
  }
}
