import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

interface CartItem {
  variantId: string
  quantity: number
}

export async function POST(req: Request) {
  const body = await req.json()
  const items: CartItem[] = body.items

  if (!items || items.length === 0) {
    return Response.json({ error: 'Cart is empty' }, { status: 400 })
  }

  // Look up variant prices from the DB — never trust prices sent from the client
  const supabase = await createClient()
  const variantIds = items.map((i) => i.variantId)

  const { data: variants, error } = await supabase
    .from('product_variants')
    .select('id, price, option1_name, option1_value, products(id, title, handle)')
    .in('id', variantIds)

  if (error || !variants || variants.length === 0) {
    return Response.json({ error: 'Failed to load products' }, { status: 500 })
  }

  // Build Stripe line items
  const lineItems = items.map((item) => {
    const variant = variants.find((v) => v.id === item.variantId)
    if (!variant) throw new Error(`Variant not found: ${item.variantId}`)

    const product = variant.products as unknown as { id: string; title: string; handle: string }
    const isDefaultTitle =
      variant.option1_name === 'Title' || variant.option1_name === null

    return {
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(Number(variant.price) * 100),
        product_data: {
          name: isDefaultTitle
            ? product.title
            : `${product.title} — ${variant.option1_value}`,
        },
      },
      quantity: item.quantity,
    }
  })

  // Store the cart in session metadata so the webhook can create the order.
  // Use short keys ("v" and "q") to stay well under Stripe's 500-char limit per value.
  const cartMeta = JSON.stringify(
    items.map((i) => ({ v: i.variantId, q: i.quantity }))
  )

  const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL!

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    success_url: `${origin}/order/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart`,
    shipping_address_collection: {
      allowed_countries: ['US'],
    },
    metadata: {
      cart: cartMeta,
    },
  })

  return Response.json({ url: session.url })
}
