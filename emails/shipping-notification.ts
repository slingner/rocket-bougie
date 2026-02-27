interface OrderItem {
  title: string
  variant_title: string | null
  quantity: number
  unit_price: number
  total_price: number
}

interface ShippingNotificationData {
  orderNumber: number
  trackingNumber: string | null
  trackingUrl: string | null
  items: OrderItem[]
  shippingName: string | null
  shippingAddress1: string | null
  shippingAddress2: string | null
  shippingCity: string | null
  shippingState: string | null
  shippingZip: string | null
}

export function shippingNotificationHtml(data: ShippingNotificationData): string {
  const {
    orderNumber,
    trackingNumber,
    trackingUrl,
    items,
    shippingName,
    shippingAddress1,
    shippingAddress2,
    shippingCity,
    shippingState,
    shippingZip,
  } = data

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e8e4de; font-size: 14px; color: #1a1a1a;">
          ${item.title}${item.variant_title ? ` <span style="color: #888; font-size: 13px;">(${item.variant_title})</span>` : ''}
          ${item.quantity > 1 ? ` <span style="color: #888; font-size: 13px;">× ${item.quantity}</span>` : ''}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e8e4de; font-size: 14px; color: #1a1a1a; text-align: right; white-space: nowrap;">
          $${item.total_price.toFixed(2)}
        </td>
      </tr>
    `
    )
    .join('')

  const shippingLines = [
    shippingName,
    shippingAddress1,
    shippingAddress2,
    [shippingCity, shippingState, shippingZip].filter(Boolean).join(', '),
  ]
    .filter(Boolean)
    .map((line) => `<div>${line}</div>`)
    .join('')

  const trackingButton = trackingUrl
    ? `
      <a href="${trackingUrl}" style="display: inline-block; margin-top: 16px; background-color: #166534; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 100px; font-family: Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600;">
        Track your package →
      </a>
    `
    : ''

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your order has shipped — Rocket Boogie Co.</title>
</head>
<body style="margin: 0; padding: 0; background-color: #faf9f6; font-family: Georgia, serif; color: #1a1a1a;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf9f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom: 32px;">
              <img src="https://rocketboogie.com/logo.png" alt="Rocket Boogie Co." style="height: 44px; width: auto; display: block;" />
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="background-color: #d1fae5; border-radius: 12px; padding: 32px; margin-bottom: 24px;">
              <p style="margin: 0 0 8px; font-size: 13px; font-family: Helvetica, Arial, sans-serif; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #166534; opacity: 0.8;">Order #${orderNumber}</p>
              <h1 style="margin: 0; font-size: 28px; font-weight: 400; letter-spacing: -0.02em; line-height: 1.2; color: #1a1a1a;">
                Your order is on its way!
              </h1>
              <p style="margin: 12px 0 0; font-family: Helvetica, Arial, sans-serif; font-size: 14px; color: #1a1a1a; opacity: 0.7; line-height: 1.6;">
                We've packed it up and handed it off. It should be with you soon.
              </p>
              ${trackingNumber ? `
              <p style="margin: 16px 0 0; font-family: Helvetica, Arial, sans-serif; font-size: 13px; color: #166534; font-weight: 600;">
                Tracking number: ${trackingNumber}
              </p>
              ` : ''}
              ${trackingButton}
            </td>
          </tr>

          <tr><td style="height: 24px;"></td></tr>

          <!-- Items ordered -->
          <tr>
            <td style="background-color: #f0ede8; border-radius: 12px; padding: 24px;">
              <p style="margin: 0 0 16px; font-size: 18px; font-weight: 400; letter-spacing: -0.01em;">What you ordered</p>

              <table width="100%" cellpadding="0" cellspacing="0">
                ${itemRows}
              </table>
            </td>
          </tr>

          <!-- Shipping address -->
          ${
            shippingAddress1
              ? `
          <tr><td style="height: 16px;"></td></tr>
          <tr>
            <td style="background-color: #f0ede8; border-radius: 12px; padding: 24px;">
              <p style="margin: 0 0 10px; font-size: 18px; font-weight: 400; letter-spacing: -0.01em;">Shipping to</p>
              <div style="font-family: Helvetica, Arial, sans-serif; font-size: 14px; color: #555; line-height: 1.8;">
                ${shippingLines}
              </div>
            </td>
          </tr>
          `
              : ''
          }

          <tr><td style="height: 32px;"></td></tr>

          <!-- Footer -->
          <tr>
            <td style="border-top: 1px solid #e8e4de; padding-top: 24px;">
              <p style="margin: 0; font-family: Helvetica, Arial, sans-serif; font-size: 13px; color: #888; line-height: 1.6;">
                Questions about your order? Reply to this email and we'll help you out.
              </p>
              <p style="margin: 8px 0 0; font-family: Helvetica, Arial, sans-serif; font-size: 12px; color: #aaa;">
                © Rocket Boogie Co. · rocketboogie.com
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
  `.trim()
}

export function shippingNotificationSubject(orderNumber: number): string {
  return `Your Rocket Boogie order #${orderNumber} has shipped!`
}
