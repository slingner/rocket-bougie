import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { orderConfirmationHtml, orderConfirmationSubject } from '@/emails/order-confirmation'
import { abandonedCartHtml, abandonedCartSubject } from '@/emails/abandoned-cart'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response('Webhook signature verification failed', { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    // Only handle one-time payment checkouts here; subscriptions are handled by customer.subscription.created
    if (session.mode === 'payment') {
      try {
        await handleCheckoutCompleted(session)
      } catch (err) {
        console.error('Failed to handle checkout.session.completed:', err)
        return new Response('Order creation failed', { status: 500 })
      }
    }
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session
    try {
      await handleCheckoutExpired(session)
    } catch (err) {
      console.error('Failed to handle checkout.session.expired:', err)
    }
  }

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    const subscription = event.data.object as Stripe.Subscription
    try {
      await handleSubscriptionEvent(subscription)
    } catch (err) {
      console.error(`Failed to handle ${event.type}:`, err)
    }
  }

  return new Response('OK', { status: 200 })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Parse the cart we stored in metadata at checkout time
  const rawCart = session.metadata?.cart
  if (!rawCart) throw new Error('No cart metadata on session')

  const cart: { v: string; q: number }[] = JSON.parse(rawCart)
  const variantIds = cart.map((i) => i.v)

  const supabase = await createAdminClient()

  // Look up variant + product details
  const { data: variants, error: variantError } = await supabase
    .from('product_variants')
    .select('id, price, option1_name, option1_value, products(id, title, handle, product_images!product_images_product_id_fkey(url, position))')
    .in('id', variantIds)

  if (variantError || !variants) throw new Error(`Failed to fetch variants: ${variantError?.message}`)

  // Calculate subtotal from DB prices (Stripe total is the source of truth for what was charged)
  const subtotal = cart.reduce((sum, item) => {
    const v = variants.find((v) => v.id === item.v)
    return sum + Number(v?.price ?? 0) * item.q
  }, 0)

  const charged = session.amount_total ? session.amount_total / 100 : subtotal
  const shippingTotal = (session.total_details?.amount_shipping ?? 0) / 100
  const taxTotal = (session.total_details?.amount_tax ?? 0) / 100
  // shipping_details is present at runtime but the TS types don't declare it
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addr = (session as any).shipping_details?.address

  // Create the order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      email: session.customer_details?.email ?? '',
      status: 'paid',
      stripe_payment_intent_id: session.payment_intent as string | null,
      stripe_checkout_session_id: session.id,
      subtotal,
      shipping_total: shippingTotal,
      tax_total: taxTotal,
      total: charged,
      shipping_name: session.customer_details?.name ?? null,
      shipping_address1: addr?.line1 ?? null,
      shipping_address2: addr?.line2 ?? null,
      shipping_city: addr?.city ?? null,
      shipping_state: addr?.state ?? null,
      shipping_zip: addr?.postal_code ?? null,
      shipping_country: addr?.country ?? 'US',
    })
    .select('id, order_number')
    .single()

  if (orderError || !order) throw new Error(`Failed to create order: ${orderError?.message}`)

  // Create order items
  const orderItems = cart.map((item) => {
    const variant = variants.find((v) => v.id === item.v)
    const product = variant?.products as unknown as
      | { id: string; title: string; handle: string; product_images: { url: string; position: number }[] }
      | null

    const isDefaultTitle =
      variant?.option1_name === 'Title' || variant?.option1_name === null

    const images = product?.product_images ?? []
    const imageUrl = images.sort((a, b) => a.position - b.position)[0]?.url ?? null

    return {
      order_id: order.id,
      product_id: product?.id ?? null,
      variant_id: item.v,
      title: product?.title ?? 'Unknown Product',
      variant_title: isDefaultTitle ? null : (variant?.option1_value ?? null),
      quantity: item.q,
      unit_price: Number(variant?.price ?? 0),
      total_price: Number(variant?.price ?? 0) * item.q,
      image_url: imageUrl,
    }
  })

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
  if (itemsError) throw new Error(`Failed to create order items: ${itemsError.message}`)

  // Increment discount code usage count if one was applied
  const discountCodeId = session.metadata?.discount_code_id
  if (discountCodeId) {
    try {
      const { data: codeRow } = await supabase
        .from('discount_codes')
        .select('usage_count')
        .eq('id', discountCodeId)
        .single()
      if (codeRow) {
        await supabase
          .from('discount_codes')
          .update({ usage_count: codeRow.usage_count + 1 })
          .eq('id', discountCodeId)
      }
    } catch (err) {
      console.error('Failed to increment discount usage:', err)
    }
  }

  // Send confirmation email (non-critical, don't throw if it fails)
  const customerEmail = session.customer_details?.email
  if (customerEmail) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: customerEmail,
        subject: orderConfirmationSubject(order.order_number),
        html: orderConfirmationHtml({
          orderNumber: order.order_number,
          customerName: session.customer_details?.name ?? null,
          customerEmail,
          items: orderItems.map((i) => ({
            title: i.title,
            variant_title: i.variant_title,
            quantity: i.quantity,
            unit_price: i.unit_price,
            total_price: i.total_price,
          })),
          subtotal,
          shippingTotal,
          taxTotal,
          total: charged,
          shippingName: session.customer_details?.name ?? null,
          shippingAddress1: addr?.line1 ?? null,
          shippingAddress2: addr?.line2 ?? null,
          shippingCity: addr?.city ?? null,
          shippingState: addr?.state ?? null,
          shippingZip: addr?.postal_code ?? null,
        }),
      })
    } catch (emailErr) {
      console.error('Failed to send confirmation email:', emailErr)
    }
  }
}

async function handleSubscriptionEvent(subscription: Stripe.Subscription) {
  const supabase = await createAdminClient()

  // Fetch customer email from Stripe
  const customer = await stripe.customers.retrieve(subscription.customer as string)
  const email = 'deleted' in customer ? '' : (customer.email ?? '')
  const name = 'deleted' in customer ? null : (customer.name ?? null)

  const status = subscription.status // active, past_due, canceled, unpaid, etc.
  const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000).toISOString()
  const cancelledAt = subscription.canceled_at
    ? new Date(subscription.canceled_at * 1000).toISOString()
    : null

  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      email,
      name,
      status,
      current_period_end: currentPeriodEnd,
      cancelled_at: cancelledAt,
    }, { onConflict: 'stripe_subscription_id' })

  if (error) throw new Error(`Failed to upsert subscription: ${error.message}`)
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  // Only send recovery email if the customer consented to promotional emails
  const consented = session.consent?.promotions === 'opt_in'
  if (!consented) return

  // Need a recovery URL and an email address to send to
  const recoveryUrl = session.after_expiration?.recovery?.url
  const customerEmail = session.customer_details?.email
  if (!recoveryUrl || !customerEmail) return

  // Look up cart items from metadata
  const rawCart = session.metadata?.cart
  if (!rawCart) return

  const cart: { v: string; q: number }[] = JSON.parse(rawCart)
  if (cart.length === 0) return

  const supabase = await createAdminClient()
  const { data: variants } = await supabase
    .from('product_variants')
    .select('id, price, option1_name, option1_value, products(title, product_images!product_images_product_id_fkey(url, position))')
    .in('id', cart.map((i) => i.v))

  if (!variants) return

  const items = cart.map((item) => {
    const variant = variants.find((v) => v.id === item.v)
    const product = variant?.products as unknown as { title: string; product_images: { url: string; position: number }[] } | null
    const images = product?.product_images ?? []
    const imageUrl = images.sort((a, b) => a.position - b.position)[0]?.url ?? null
    const isDefaultTitle = variant?.option1_name === 'Title' || variant?.option1_name === null

    return {
      title: product?.title ?? 'Unknown Product',
      variant_title: isDefaultTitle ? null : (variant?.option1_value ?? null),
      quantity: item.q,
      unit_price: Number(variant?.price ?? 0),
      image_url: imageUrl,
    }
  })

  const customerName = session.customer_details?.name ?? null
  const discountCode = process.env.ABANDONED_CART_DISCOUNT_CODE ?? null

  await resend.emails.send({
    from: FROM_EMAIL,
    to: customerEmail,
    subject: abandonedCartSubject(customerName),
    html: abandonedCartHtml({ customerName, items, recoveryUrl, discountCode }),
  })
}
