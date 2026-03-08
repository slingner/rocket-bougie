import { stripe } from '@/lib/stripe'

const COUPON_LOOKUP_KEY = 'sticker-club-10pct'

async function getOrCreateBaseCoupon() {
  // Check if our base coupon already exists via metadata
  const coupons = await stripe.coupons.list({ limit: 100 })
  const existing = coupons.data.find(c => c.metadata?.lookup_key === COUPON_LOOKUP_KEY)
  if (existing) return existing

  return stripe.coupons.create({
    percent_off: 10,
    duration: 'once',
    name: '10% off for Sticker Club members',
    metadata: { lookup_key: COUPON_LOOKUP_KEY },
  })
}

function generateCode() {
  const now = new Date()
  const month = now.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  const year = String(now.getFullYear()).slice(2)
  return `CLUB${month}${year}`
}

export async function POST() {
  try {
    const coupon = await getOrCreateBaseCoupon()
    const code = generateCode()

    // Check if this month's code already exists
    const existing = await stripe.promotionCodes.list({ code, limit: 1 })
    if (existing.data.length > 0) {
      return Response.json({ code: existing.data[0].code, alreadyExisted: true })
    }

    // Expires in 40 days so late shippers have a little buffer
    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 40

    const promo = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code,
      expires_at: expiresAt,
      restrictions: { first_time_transaction: false },
    })

    return Response.json({ code: promo.code, alreadyExisted: false })
  } catch (err) {
    console.error('Coupon generation error:', err)
    return Response.json(
      { error: err instanceof Error ? err.message : 'Failed to generate code' },
      { status: 500 }
    )
  }
}
