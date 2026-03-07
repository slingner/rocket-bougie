import { stripe } from '@/lib/stripe'

const STICKER_CLUB_PRICE_CENTS = 1500 // $15.00

async function getStickerClubPrice() {
  // Retrieve by lookup key first (idempotent)
  const existing = await stripe.prices.list({
    lookup_keys: ['sticker-club-monthly'],
    limit: 1,
    expand: ['data.product'],
  })

  if (existing.data.length > 0) return existing.data[0]

  // First time setup: create the product and price
  const product = await stripe.products.create({
    name: 'Monthly Sticker Club',
    description: 'A curated pack of Rocket Boogie stickers shipped every month.',
  })

  return stripe.prices.create({
    product: product.id,
    unit_amount: STICKER_CLUB_PRICE_CENTS,
    currency: 'usd',
    recurring: { interval: 'month' },
    lookup_key: 'sticker-club-monthly',
    transfer_lookup_key: true,
  })
}

export async function POST(req: Request) {
  try {
    const price = await getStickerClubPrice()
    const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL!

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: `${origin}/sticker-club/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/sticker-club`,
      billing_address_collection: 'required',
      shipping_address_collection: { allowed_countries: ['US'] },
      automatic_tax: { enabled: true },
    })

    return Response.json({ url: session.url })
  } catch (err) {
    console.error('Subscription checkout error:', err)
    return Response.json(
      { error: err instanceof Error ? err.message : 'Failed to start checkout' },
      { status: 500 }
    )
  }
}
