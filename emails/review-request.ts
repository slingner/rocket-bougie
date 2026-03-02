interface ReviewItem {
  productTitle: string
  imageUrl: string | null
  reviewUrl: string
}

function logoUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}/logo.png`
  return 'https://rocketboogie.com/logo.png'
}

export function reviewRequestHtml(items: ReviewItem[]): string {
  const itemRows = items.map(item => `
    <tr>
      <td style="padding: 20px 0; border-bottom: 1px solid #e8e4de;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            ${item.imageUrl ? `
            <td style="width: 64px; padding-right: 16px;" valign="top">
              <img src="${item.imageUrl}" alt="${item.productTitle}"
                style="width: 64px; height: 64px; object-fit: cover; border-radius: 8px; display: block;" />
            </td>
            ` : ''}
            <td valign="middle">
              <p style="margin: 0 0 10px; font-size: 15px; color: #1a1a1a;">${item.productTitle}</p>
              <a href="${item.reviewUrl}"
                style="display: inline-block; background-color: #ffaaaa; color: #1a1a1a; text-decoration: none;
                       font-family: Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600;
                       padding: 8px 20px; border-radius: 100px;">
                Leave a review →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>How was your order? | Rocket Boogie Co.</title>
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
              <h1 style="margin: 0 0 12px; font-size: 26px; font-weight: 400; letter-spacing: -0.02em; line-height: 1.2;">
                How was your order?
              </h1>
              <p style="margin: 0; font-family: Helvetica, Arial, sans-serif; font-size: 14px; opacity: 0.75; line-height: 1.6;">
                We hope everything arrived safely and you love it.
                Your review helps other customers find the right piece — and means a lot to us as a small studio.
              </p>
            </td>
          </tr>

          <tr><td style="height: 24px;"></td></tr>

          <!-- Products -->
          <tr>
            <td style="background-color: #f0ede8; border-radius: 12px; padding: 24px 24px 4px;">
              <p style="margin: 0 0 4px; font-size: 18px; font-weight: 400; letter-spacing: -0.01em;">
                ${items.length === 1 ? 'Your item' : 'Your items'}
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${itemRows}
              </table>
            </td>
          </tr>

          <tr><td style="height: 32px;"></td></tr>

          <!-- Footer -->
          <tr>
            <td style="border-top: 1px solid #e8e4de; padding-top: 24px;">
              <p style="margin: 0; font-family: Helvetica, Arial, sans-serif; font-size: 13px; color: #888; line-height: 1.6;">
                Each link is unique to your order. Reviews are moderated before being published.
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

export function reviewRequestSubject(): string {
  return 'How was your Rocket Boogie order?'
}
