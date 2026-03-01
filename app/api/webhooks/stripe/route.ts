import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { orderConfirmationHtml, orderConfirmationSubject } from '@/emails/order-confirmation'

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
    try {
      await handleCheckoutCompleted(session)
    } catch (err) {
      console.error('Failed to handle checkout.session.completed:', err)
      // Return 500 so Stripe will retry the webhook
      return new Response('Order creation failed', { status: 500 })
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
    .select('id, price, option1_name, option1_value, products(id, title, handle, product_images(url, position))')
    .in('id', variantIds)

  if (variantError || !variants) throw new Error('Failed to fetch variants')

  // Calculate subtotal from DB prices (Stripe total is the source of truth for what was charged)
  const subtotal = cart.reduce((sum, item) => {
    const v = variants.find((v) => v.id === item.v)
    return sum + Number(v?.price ?? 0) * item.q
  }, 0)

  const charged = session.amount_total ? session.amount_total / 100 : subtotal
  // shipping_details is present at runtime but the 'clover' TS types don't declare it
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
      shipping_total: 0,
      tax_total: 0,
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
