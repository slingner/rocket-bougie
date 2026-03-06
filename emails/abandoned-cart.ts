interface AbandonedCartItem {
  title: string
  variant_title: string | null
  quantity: number
  unit_price: number
  image_url: string | null
}

interface AbandonedCartData {
  customerName: string | null
  items: AbandonedCartItem[]
  recoveryUrl: string
  discountCode: string | null
}

function logoUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}/logo.png`
  return 'https://rocketboogie.com/logo.png'
}

export function abandonedCartHtml(data: AbandonedCartData): string {
  const { customerName, items, recoveryUrl, discountCode } = data

  const itemRows = items.map((item) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #e8e4de; vertical-align: middle;" width="56">
        ${item.image_url
          ? `<img src="${item.image_url}" alt="${item.title}" width="48" height="48" style="width: 48px; height: 48px; object-fit: cover; border-radius: 6px; display: block;" />`
          : `<div style="width: 48px; height: 48px; border-radius: 6px; background: #e8e4de;"></div>`
        }
      </td>
      <td style="padding: 12px 12px 12px 12px; border-bottom: 1px solid #e8e4de; font-size: 14px; color: #1a1a1a; vertical-align: middle;">
        ${item.title}${item.variant_title ? ` <span style="color: #888; font-size: 13px;">(${item.variant_title})</span>` : ''}
        ${item.quantity > 1 ? ` <span style="color: #888; font-size: 13px;">× ${item.quantity}</span>` : ''}
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #e8e4de; font-size: 14px; color: #1a1a1a; text-align: right; white-space: nowrap; vertical-align: middle;">
        $${(item.unit_price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('')

  const greeting = customerName ? `Hey ${customerName.split(' ')[0]}, you left something behind!` : 'You left something behind!'

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your cart is waiting | Rocket Boogie Co.</title>
</head>
<body style="margin: 0; padding: 0; background-color: #faf9f6; font-family: Georgia, serif; color: #1a1a1a;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf9f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom: 32px;">
              <img src="${logoUrl()}" alt="Rocket Boogie Co." style="height: 44px; width: auto; display: block;" />
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="background-color: #ffaaaa; border-radius: 12px; padding: 32px;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 400; letter-spacing: -0.02em; line-height: 1.2;">
                ${greeting}
              </h1>
              <p style="margin: 12px 0 0; font-family: Helvetica, Arial, sans-serif; font-size: 14px; opacity: 0.75; line-height: 1.6;">
                Your cart is saved and ready to go. Pop back and finish your order — items may sell out.
              </p>
            </td>
          </tr>

          <tr><td style="height: 24px;"></td></tr>

          <!-- Cart items -->
          <tr>
            <td style="background-color: #f0ede8; border-radius: 12px; padding: 24px;">
              <p style="margin: 0 0 16px; font-size: 18px; font-weight: 400; letter-spacing: -0.01em;">What's in your cart</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${itemRows}
              </table>
            </td>
          </tr>

          <tr><td style="height: 24px;"></td></tr>

          <!-- Discount code -->
          ${discountCode ? `
          <tr>
            <td style="background-color: #f0ede8; border-radius: 12px; padding: 20px 24px;">
              <p style="margin: 0 0 4px; font-family: Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; opacity: 0.55;">Special offer</p>
              <p style="margin: 0; font-size: 15px; font-weight: 400; line-height: 1.5;">
                Use code <strong style="font-family: Helvetica, Arial, sans-serif; background: #ffaaaa; padding: 2px 8px; border-radius: 4px;">${discountCode}</strong> at checkout for a little something off.
              </p>
            </td>
          </tr>
          <tr><td style="height: 24px;"></td></tr>
          ` : ''}

          <!-- CTA -->
          <tr>
            <td align="center">
              <a href="${recoveryUrl}" style="display: inline-block; background-color: #1a1a1a; color: #faf9f6; text-decoration: none; font-family: Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; padding: 14px 36px; border-radius: 8px; letter-spacing: 0.01em;">
                Complete your order →
              </a>
            </td>
          </tr>

          <tr><td style="height: 32px;"></td></tr>

          <!-- Footer -->
          <tr>
            <td style="border-top: 1px solid #e8e4de; padding-top: 24px;">
              <p style="margin: 0; font-family: Helvetica, Arial, sans-serif; font-size: 13px; color: #888; line-height: 1.6;">
                Questions? Reply to this email and we'll help you out.
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

export function abandonedCartSubject(customerName: string | null): string {
  return customerName
    ? `${customerName.split(' ')[0]}, your cart is waiting for you`
    : 'Your cart is waiting for you'
}
