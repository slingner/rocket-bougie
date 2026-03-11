const SANDBOX_BASE = 'https://shipping-api-sandbox.pitneybowes.com'
const PROD_BASE = 'https://shipping-api.pitneybowes.com'

const BASE_URL = process.env.PITNEY_BOWES_SANDBOX === 'false' ? PROD_BASE : SANDBOX_BASE

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

  const res = await fetch(`${BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Pitney Bowes auth failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  const expiresIn = Number(data.expiresIn ?? 28800) * 1000
  cachedToken = { value: data.access_token, expiresAt: now + expiresIn }
  return cachedToken.value
}

async function pbFetch<T>(path: string, body: unknown, extraHeaders?: Record<string, string>): Promise<T> {
  const token = await getAccessToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-PB-UnifiedErrorStructure': 'true',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Pitney Bowes ${res.status}: ${text}`)
  }
  return res.json()
}

// Maps PB service IDs to human-readable names
const SERVICE_NAMES: Record<string, string> = {
  FCM: 'First-Class Mail',
  FCPS: 'First-Class Package Service',
  PM: 'Priority Mail',
  PME: 'Priority Mail Express',
  PRCLSEL: 'Parcel Select',
  PMOD: 'Priority Mail Open & Distribute',
  EM: 'Express Mail',
  LP: 'Library Mail',
  MM: 'Media Mail',
  BPM: 'Bound Printed Matter',
}

export type PBRate = {
  id: string
  carrier: string
  serviceId: string
  parcelType: string
  serviceName: string
  totalCharge: number
  currency: string
  estimatedDays: string | null
  estimatedDelivery: string | null
}

export async function getPBRates(params: {
  fromZip: string
  toZip: string
  toCountry: string
  weightLb: number
  lengthIn: number
  widthIn: number
  heightIn: number
}): Promise<PBRate[]> {
  const shipperId = process.env.PITNEY_BOWES_SHIPPER_ID
  const shipmentOptions = shipperId ? [{ name: 'SHIPPER_ID', value: shipperId }] : []

  const data = await pbFetch<{ rates: Array<{
    carrier: string
    serviceId: string
    parcelType: string
    rateTypeId?: string
    totalCarrierCharge: number
    currencyCode: string
    deliveryCommitment?: {
      estimatedDeliveryDateTime?: string
      minEstimatedNumberOfDays?: string
      maxEstimatedNumberOfDays?: string
    }
  }> }>('/shippingservices/v1/rates?includeDeliveryCommitment=true', {
    fromAddress: { postalCode: params.fromZip, countryCode: 'US' },
    toAddress: { postalCode: params.toZip, countryCode: params.toCountry },
    parcel: {
      weight: { unitOfMeasurement: 'OZ', weight: Math.round(params.weightLb * 16 * 100) / 100 },
      dimension: {
        unitOfMeasurement: 'IN',
        length: params.lengthIn,
        width: params.widthIn,
        height: params.heightIn,
      },
    },
    rates: [{ carrier: 'USPS' }],
    shipmentOptions,
  })

  const rawRates = data.rates ?? []

  const mapped: PBRate[] = rawRates.map((r, i) => ({
    id: `pb-${r.carrier}-${r.serviceId}-${r.rateTypeId ?? i}`,
    carrier: r.carrier.toUpperCase(),
    serviceId: r.serviceId,
    parcelType: r.parcelType ?? 'PKG',
    serviceName: SERVICE_NAMES[r.serviceId] ?? r.serviceId,
    totalCharge: r.totalCarrierCharge,
    currency: r.currencyCode ?? 'USD',
    estimatedDays: r.deliveryCommitment?.minEstimatedNumberOfDays
      ? r.deliveryCommitment.minEstimatedNumberOfDays === r.deliveryCommitment.maxEstimatedNumberOfDays
        ? r.deliveryCommitment.minEstimatedNumberOfDays
        : `${r.deliveryCommitment.minEstimatedNumberOfDays}–${r.deliveryCommitment.maxEstimatedNumberOfDays}`
      : null,
    estimatedDelivery: r.deliveryCommitment?.estimatedDeliveryDateTime ?? null,
  }))

  // Keep only cheapest rate per service (PB returns multiple rate types per service)
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
}): Promise<PBTransaction> {
  const shipperId = process.env.PITNEY_BOWES_SHIPPER_ID
  const shipmentOptions: Array<{ name: string; value: string }> = []
  if (shipperId) shipmentOptions.push({ name: 'SHIPPER_ID', value: shipperId })

  const toAddressLines = [params.toStreet1]
  if (params.toStreet2) toAddressLines.push(params.toStreet2)

  const docSize = ['LETTER', 'FLAT'].includes(params.parcelType) ? 'DOC_6X4' : 'DOC_4X6'
  const transactionId = crypto.randomUUID()

  const data = await pbFetch<{
    shipmentId: string
    parcelTrackingNumber: string
    documents: Array<{ type: string; contentType: string; contents: string }>
  }>('/shippingservices/v1/shipments', {
    fromAddress: {
      name: params.fromName,
      addressLines: [params.fromStreet1],
      cityTown: params.fromCity,
      stateProvince: params.fromState,
      postalCode: params.fromZip,
      countryCode: 'US',
      phone: params.fromPhone,
    },
    toAddress: {
      name: params.toName,
      addressLines: toAddressLines,
      cityTown: params.toCity,
      stateProvince: params.toState,
      postalCode: params.toZip,
      countryCode: params.toCountry,
    },
    parcel: {
      weight: { unitOfMeasurement: 'OZ', weight: Math.round(params.weightLb * 16 * 100) / 100 },
      dimension: {
        unitOfMeasurement: 'IN',
        length: params.lengthIn,
        width: params.widthIn,
        height: params.heightIn,
      },
    },
    rates: [{
      carrier: params.carrier,
      serviceId: params.serviceId,
      parcelType: params.parcelType,
      inductionPostalCode: params.fromZip,
    }],
    shipmentOptions,
    documents: [{
      type: 'SHIPPING_LABEL',
      contentType: 'URL',
      fileFormat: 'PDF',
      size: docSize,
      printDialogOption: 'NO_PRINT_DIALOG',
    }],
  }, { 'X-PB-TransactionId': transactionId })

  const labelDoc = data.documents?.find(d => d.type === 'SHIPPING_LABEL')
  if (!labelDoc?.contents) throw new Error('Pitney Bowes returned no label URL')

  return {
    shipmentId: data.shipmentId,
    trackingNumber: data.parcelTrackingNumber,
    labelUrl: labelDoc.contents,
  }
}
