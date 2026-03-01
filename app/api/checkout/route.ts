import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { calculateRuleDiscounts } from '@/lib/discounts'
import type { DiscountRule } from '@/lib/discounts'

interface CartItem {
  variantId: string
  quantity: number
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const items: CartItem[] = body.items
    const discountCode: string | null = body.discountCode ?? null
    const allowPromoCodes: boolean = body.allowPromoCodes ?? false

    if (!items || items.length === 0) {
      return Response.json({ error: 'Cart is empty' }, { status: 400 })
    }

    // Look up variant prices from the DB; never trust prices sent from the client
    const supabase = await createClient()
    const variantIds = items.map((i) => i.variantId)

    const { data: variants, error: variantError } = await supabase
      .from('product_variants')
      .select('id, price, option1_name, option1_value, option2_name, option2_value, products(id, title, handle, tags)')
      .in('id', variantIds)

    if (variantError) {
      console.error('Supabase error fetching variants:', variantError)
      return Response.json({ error: 'Failed to load products' }, { status: 500 })
    }

    if (!variants || variants.length === 0) {
      console.error('No variants found for IDs:', variantIds)
      return Response.json({ error: 'Products not found' }, { status: 500 })
    }

    // Build Stripe line items
    const lineItems = items.map((item) => {
      const variant = variants.find((v) => v.id === item.variantId)
      if (!variant) {
        throw new Error(`Variant not found: ${item.variantId}`)
      }

      const product = variant.products as unknown as { id: string; title: string; handle: string; tags: string[] }
      if (!product) {
        throw new Error(`Product not found for variant: ${item.variantId}`)
      }

      const isDefaultTitle =
        variant.option1_name === 'Title' || variant.option1_name === null

      const variantSuffix = [variant.option1_value, variant.option2_value]
        .filter(Boolean)
        .join(' / ')

      return {
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(Number(variant.price) * 100),
          product_data: {
            name: isDefaultTitle ? product.title : `${product.title}: ${variantSuffix}`,
          },
        },
        quantity: item.quantity,
      }
    })

    // Fetch active discount rules and apply automatic volume discounts
    const adminSupabase = await createAdminClient()
    const { data: rulesData } = await adminSupabase
      .from('discount_rules')
      .select('*')
      .eq('active', true)
      .order('sort_order')

    const rules = (rulesData ?? []) as DiscountRule[]

    const cartItemsForDiscount = items.map((item) => {
      const variant = variants.find((v) => v.id === item.variantId)
      const product = variant?.products as unknown as { tags: string[] } | null
      return {
        tags: product?.tags ?? [],
        price: Number(variant?.price ?? 0),
        quantity: item.quantity,
      }
    })

    const ruleDiscounts = calculateRuleDiscounts(cartItemsForDiscount, rules)

    // Add negative line items for each rule discount
    for (const rd of ruleDiscounts) {
      if (rd.discountAmount <= 0) continue
      lineItems.push({
        price_data: {
          currency: 'usd',
          unit_amount: -Math.round(rd.discountAmount * 100),
          product_data: { name: `Deal: ${rd.name}` },
        },
        quantity: 1,
      })
    }

    // Validate discount code server-side (re-validate to prevent tampering)
    let stripePromotionCodeId: string | null = null
    let stripeCouponId: string | null = null  // fallback for codes created before promo code migration
    let discountCodeId: string | null = null

    if (discountCode) {
      const subtotal = items.reduce((sum, item) => {
        const v = variants.find((v) => v.id === item.variantId)
        return sum + Number(v?.price ?? 0) * item.quantity
      }, 0)

      const adminSupabase = await createAdminClient()
      const { data: code } = await adminSupabase
        .from('discount_codes')
        .select('*')
        .eq('code', discountCode.trim().toUpperCase())
        .single()

      if (code && code.active) {
        const notExpired = !code.expires_at || new Date(code.expires_at) >= new Date()
        const notExhausted = code.usage_limit === null || code.usage_count < code.usage_limit
        const minMet = code.min_order_amount === null || subtotal >= Number(code.min_order_amount)

        if (notExpired && notExhausted && minMet) {
          discountCodeId = code.id
          if (code.stripe_promotion_code_id) {
            stripePromotionCodeId = code.stripe_promotion_code_id
          } else if (code.stripe_coupon_id) {
            // Legacy codes created before promotion code support
            stripeCouponId = code.stripe_coupon_id
          }
        }
      }
    }

    // Store the cart + discount info in session metadata so the webhook can create the order.
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
        ...(discountCodeId ? { discount_code_id: discountCodeId } : {}),
      },
      // allow_promotion_codes and discounts are mutually exclusive in Stripe.
      // First-time-only codes are validated by Stripe at checkout (allowPromoCodes=true).
      // Regular codes are pre-applied here.
      ...(allowPromoCodes
        ? { allow_promotion_codes: true }
        : stripePromotionCodeId
          ? { discounts: [{ promotion_code: stripePromotionCodeId }] }
          : stripeCouponId
            ? { discounts: [{ coupon: stripeCouponId }] }
            : {}),
    })

    return Response.json({ url: session.url })
  } catch (err) {
    console.error('Checkout error:', err)
    return Response.json(
      { error: err instanceof Error ? err.message : 'Checkout failed' },
      { status: 500 }
    )
  }
}
