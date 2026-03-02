const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rocketboogie.com'

export function buildWelcomeEmail({ code }: { code: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Rocket Boogie Co.</title>
</head>
<body style="margin:0;padding:0;background:#faf9f6;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf9f6;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <a href="${SITE_URL}" style="text-decoration:none;">
                <img src="${SITE_URL}/logo.png" alt="Rocket Boogie Co." height="48" style="display:block;" />
              </a>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;padding:40px 36px;border:1px solid #e8e4de;">

              <p style="font-family:Georgia,serif;font-size:26px;font-weight:400;letter-spacing:-0.02em;color:#1a1a1a;margin:0 0 12px;">
                Welcome to the club 🎉
              </p>
              <p style="font-size:15px;color:#1a1a1a;opacity:0.65;line-height:1.7;margin:0 0 28px;">
                Thanks for subscribing! We make stickers, prints, cards, and more — all designed to make you smile. Here's a little thank-you gift:
              </p>

              <!-- Discount code box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center" style="background:#faf9f6;border:2px dashed #e8e4de;border-radius:12px;padding:24px;">
                    <p style="font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#1a1a1a;opacity:0.4;margin:0 0 8px;">
                      Your discount code
                    </p>
                    <p style="font-family:'Courier New',monospace;font-size:28px;font-weight:700;letter-spacing:0.08em;color:#1a1a1a;margin:0 0 8px;">
                      ${code}
                    </p>
                    <p style="font-size:13px;color:#1a1a1a;opacity:0.5;margin:0;">
                      10% off your first order · one-time use
                    </p>
                  </td>
                </tr>
              </table>

              <p style="font-size:14px;color:#1a1a1a;opacity:0.6;line-height:1.7;margin:0 0 28px;">
                Just enter the code at checkout. It's good for 10% off any order — no minimum required.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background:#EAA221;border:1.5px solid #8a6415;border-radius:100px;">
                    <a href="${SITE_URL}/shop" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#1a1a1a;text-decoration:none;font-family:'Helvetica Neue',Arial,sans-serif;">
                      Shop now
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="font-size:12px;color:#1a1a1a;opacity:0.35;margin:0;line-height:1.6;">
                Rocket Boogie Co. · San Francisco, CA<br />
                You're receiving this because you subscribed at rocketboogie.com.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
