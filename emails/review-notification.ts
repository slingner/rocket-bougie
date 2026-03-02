interface ReviewNotificationData {
  productTitle: string
  rating: number
  body: string | null
  customerName: string
  adminUrl: string
}

const STARS = ['★', '★', '★', '★', '★']

export function reviewNotificationHtml(data: ReviewNotificationData): string {
  const { productTitle, rating, body, customerName, adminUrl } = data
  const stars = STARS.map((s, i) =>
    `<span style="color: ${i < rating ? '#ffaaaa' : '#ddd'}; font-size: 22px;">${s}</span>`
  ).join('')

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New review | Rocket Boogie</title>
</head>
<body style="margin: 0; padding: 0; background-color: #faf9f6; font-family: Georgia, serif; color: #1a1a1a;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf9f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px;">

          <tr>
            <td style="background-color: #f0ede8; border-radius: 12px; padding: 28px;">
              <p style="margin: 0 0 4px; font-family: Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 600;
                         letter-spacing: 0.08em; text-transform: uppercase; color: #888;">
                New review pending approval
              </p>
              <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 400; letter-spacing: -0.02em;">
                ${productTitle}
              </h1>

              <div style="margin-bottom: 12px;">${stars}</div>

              ${body ? `
              <p style="margin: 0 0 16px; font-family: Helvetica, Arial, sans-serif; font-size: 14px;
                         color: #444; line-height: 1.7; font-style: italic;">
                &ldquo;${body}&rdquo;
              </p>
              ` : ''}

              <p style="margin: 0 0 20px; font-family: Helvetica, Arial, sans-serif; font-size: 13px; color: #888;">
                — ${customerName}
              </p>

              <a href="${adminUrl}"
                style="display: inline-block; background-color: #1a1a1a; color: #faf9f6; text-decoration: none;
                       font-family: Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600;
                       padding: 10px 22px; border-radius: 8px;">
                Review in admin →
              </a>
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

export function reviewNotificationSubject(productTitle: string, rating: number): string {
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)
  return `New review ${stars} — ${productTitle}`
}
