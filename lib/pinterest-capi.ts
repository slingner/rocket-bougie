import { createHash } from 'crypto'

// Pinterest Conversions API (server-side conversion tracking).
// Sends purchases straight from our server, so ad blockers and cookie limits can't drop them.
// Docs: https://developers.pinterest.com/docs/api/v5/events-create/

const PINTEREST_AD_ACCOUNT_ID = '549768189455'

interface CheckoutEvent {
  eventId: string        // Stripe checkout session ID (matches the browser tag's event_id)
  email: string
  value: number
  currency: string
  items: { id: string; title: string; price: number; quantity: number }[]
}

function sha256(value: string) {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

export async function sendPinterestCheckout(event: CheckoutEvent) {
  const token = process.env.PINTEREST_CAPI_TOKEN
  if (!token) {
    console.warn('PINTEREST_CAPI_TOKEN not set, skipping Pinterest checkout event')
    return
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rocketboogie.com'

  const res = await fetch(
    `https://api.pinterest.com/v5/ad_accounts/${PINTEREST_AD_ACCOUNT_ID}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [
          {
            event_name: 'checkout',
            action_source: 'web',
            event_time: Math.floor(Date.now() / 1000),
            event_id: event.eventId,
            event_source_url: `${siteUrl}/order/confirmation`,
            user_data: { em: [sha256(event.email)] },
            custom_data: {
              currency: event.currency,
              value: event.value.toFixed(2),
              order_id: event.eventId,
              num_items: event.items.reduce((sum, i) => sum + i.quantity, 0),
              content_ids: event.items.map((i) => i.id),
              contents: event.items.map((i) => ({
                id: i.id,
                item_name: i.title,
                item_price: i.price.toFixed(2),
                quantity: i.quantity,
              })),
            },
          },
        ],
      }),
    }
  )

  if (!res.ok) {
    throw new Error(`Pinterest Conversions API returned ${res.status}: ${await res.text()}`)
  }
}
