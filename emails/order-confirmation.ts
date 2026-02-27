interface OrderItem {
  title: string
  variant_title: string | null
  quantity: number
  unit_price: number
  total_price: number
}

interface OrderConfirmationData {
  orderNumber: number
  customerName: string | null
  customerEmail: string
  items: OrderItem[]
  subtotal: number
  total: number
  shippingName: string | null
  shippingAddress1: string | null
  shippingAddress2: string | null
  shippingCity: string | null
  shippingState: string | null
  shippingZip: string | null
}

export function orderConfirmationHtml(data: OrderConfirmationData): string {
  const {
    orderNumber,
    customerName,
    items,
    subtotal,
    total,
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

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmed — Rocket Boogie Co.</title>
</head>
<body style="margin: 0; padding: 0; background-color: #faf9f6; font-family: Georgia, serif; color: #1a1a1a;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf9f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom: 32px;">
              <p style="margin: 0; font-size: 22px; letter-spacing: -0.02em;">Rocket Boogie Co.</p>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="background-color: #ffaaaa; border-radius: 12px; padding: 32px; margin-bottom: 24px;">
              <p style="margin: 0 0 8px; font-size: 13px; font-family: Helvetica, Arial, sans-serif; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.6;">Order #${orderNumber}</p>
              <h1 style="margin: 0; font-size: 28px; font-weight: 400; letter-spacing: -0.02em; line-height: 1.2;">
                ${customerName ? `Thanks, ${customerName.split(' ')[0]}!` : 'Order confirmed!'}
              </h1>
              <p style="margin: 12px 0 0; font-family: Helvetica, Arial, sans-serif; font-size: 14px; opacity: 0.7; line-height: 1.6;">
                We've received your order and will get it packed up soon.
                We'll send another email when it ships.
              </p>
            </td>
          </tr>

          <tr><td style="height: 24px;"></td></tr>

          <!-- Order summary -->
          <tr>
            <td style="background-color: #f0ede8; border-radius: 12px; padding: 24px;">
              <p style="margin: 0 0 16px; font-size: 18px; font-weight: 400; letter-spacing: -0.01em;">What you ordered</p>

              <table width="100%" cellpadding="0" cellspacing="0">
                ${itemRows}
                <!-- Subtotal -->
                <tr>
                  <td style="padding: 16px 0 4px; font-family: Helvetica, Arial, sans-serif; font-size: 13px; color: #888;">
                    Subtotal
                  </td>
                  <td style="padding: 16px 0 4px; font-family: Helvetica, Arial, sans-serif; font-size: 13px; color: #888; text-align: right;">
                    $${subtotal.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-family: Helvetica, Arial, sans-serif; font-size: 13px; color: #888;">
                    Shipping
                  </td>
                  <td style="padding: 4px 0; font-family: Helvetica, Arial, sans-serif; font-size: 13px; color: #888; text-align: right;">
                    Calculated at checkout
                  </td>
                </tr>
                <!-- Total -->
                <tr>
                  <td style="padding-top: 12px; border-top: 1px solid #e8e4de; font-size: 15px; font-weight: 600; font-family: Helvetica, Arial, sans-serif;">
                    Total
                  </td>
                  <td style="padding-top: 12px; border-top: 1px solid #e8e4de; font-size: 15px; font-weight: 600; font-family: Helvetica, Arial, sans-serif; text-align: right;">
                    $${total.toFixed(2)}
                  </td>
                </tr>
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

export function orderConfirmationSubject(orderNumber: number): string {
  return `Your Rocket Boogie order #${orderNumber} is confirmed!`
}
