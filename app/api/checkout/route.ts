import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { calculateRuleDiscounts } from '@/lib/discounts'
import type { DiscountRule } from '@/lib/discounts'
import { calculateShipping, FREE_SHIPPING_THRESHOLD } from '@/lib/shipping'
import type { ShippingProfile } from '@/lib/shipping'

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
      .select('id, price, option1_name, option1_value, option2_name, option2_value, shipping_profile_id, shipping_profiles(id, name, base_price, additional_price), products(id, title, handle, tags)')
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
          tax_behavior: 'exclusive' as const,
          product_data: {
            name: isDefaultTitle ? product.title : `${product.title}: ${variantSuffix}`,
            tax_code: 'txcd_99999999', // General - Tangible Goods
          },
        },
        quantity: item.quantity,
      }
    })

    // Calculate shipping from profile assignments
    const subtotalForShipping = items.reduce((sum, item) => {
      const v = variants.find((v) => v.id === item.variantId)
      return sum + Number(v?.price ?? 0) * item.quantity
    }, 0)

    let shippingAmountCents: number

    if (subtotalForShipping >= FREE_SHIPPING_THRESHOLD) {
      shippingAmountCents = 0
    } else {
      const shippingItems = items.map((item) => {
        const variant = variants.find((v) => v.id === item.variantId)
        const profile = variant?.shipping_profiles as unknown as ShippingProfile | null
        return { quantity: item.quantity, profile }
      })
      shippingAmountCents = Math.round(calculateShipping(shippingItems) * 100)
    }

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

    // Create a temporary Stripe coupon for any volume deal discounts.
    // Negative line items are not supported in live mode.
    let volumeCouponId: string | null = null
    const totalVolumeCents = ruleDiscounts.reduce((sum, rd) => {
      return sum + Math.round(rd.discountAmount * 100)
    }, 0)

    if (totalVolumeCents > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: totalVolumeCents,
        currency: 'usd',
        duration: 'once',
        name: ruleDiscounts.map(rd => rd.name).join(' + '),
      })
      volumeCouponId = coupon.id
    }

    // Validate discount code server-side (re-validate to prevent tampering)
    let stripePromotionCodeId: string | null = null
    let stripeCouponId: string | null = null  // fallback for codes created before promo code migration
    let discountCodeId: string | null = null

    if (discountCode) {
      const { data: code } = await adminSupabase
        .from('discount_codes')
        .select('*')
        .eq('code', discountCode.trim().toUpperCase())
        .single()

      if (code && code.active) {
        const notExpired = !code.expires_at || new Date(code.expires_at) >= new Date()
        const notExhausted = code.usage_limit === null || code.usage_count < code.usage_limit
        const minMet = code.min_order_amount === null || subtotalForShipping >= Number(code.min_order_amount)

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
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: shippingAmountCents, currency: 'usd' },
            display_name: shippingAmountCents === 0 ? 'Free Shipping' : 'USPS First-Class Mail',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 1 },
              maximum: { unit: 'business_day', value: 5 },
            },
            tax_behavior: 'exclusive',
          },
        },
      ],
      automatic_tax: { enabled: true },
      consent_collection: { promotions: 'auto' },
      after_expiration: {
        recovery: { enabled: true, allow_promotion_codes: true },
      },
      expires_at: Math.floor(Date.now() / 1000) + 3600, // expire after 1 hour → triggers abandoned cart webhook
      metadata: {
        cart: cartMeta,
        ...(discountCodeId ? { discount_code_id: discountCodeId } : {}),
      },
      // allow_promotion_codes and discounts are mutually exclusive in Stripe.
      // If volume deals are active, we must use discounts[] and can't use allow_promotion_codes.
      // Regular promo codes are combined with volume deal coupons in the discounts array.
      ...(() => {
        const discounts: Array<{ coupon: string } | { promotion_code: string }> = []
        if (volumeCouponId) discounts.push({ coupon: volumeCouponId })
        if (stripePromotionCodeId) discounts.push({ promotion_code: stripePromotionCodeId })
        else if (stripeCouponId) discounts.push({ coupon: stripeCouponId })

        if (discounts.length > 0) return { discounts }
        if (allowPromoCodes) return { allow_promotion_codes: true }
        return {}
      })(),
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
