// ─── Template registry ────────────────────────────────────────────────────────

export type TemplateId = 'classic' | 'hero' | 'editorial' | 'announcement' | 'split' | 'minimal'

export type TemplateInfo = {
  id: TemplateId
  name: string
  description: string
  hasImage: boolean
  defaultSubject: string
  defaultPreviewText: string
  defaultContent: string
}

export const TEMPLATES: TemplateInfo[] = [
  {
    id: 'classic',
    name: 'The Roundup',
    description: 'Multi-topic newsletter — new products, studio news, anything goes',
    hasImage: false,
    defaultSubject: 'Hello from the studio 🌿',
    defaultPreviewText: 'New prints, new stickers, and a note from us',
    defaultContent: `<h2>Hi there 👋</h2><p>Hope you're having a good week. Here's a quick look at what's new at Rocket Boogie.</p><h3>New in the shop</h3><p><strong>California Coast Prints</strong> — Six new coastal illustrations just landed, including Big Sur cliffs and Marin fog. Available in 8×10 and 11×14 on archival matte paper.</p><p><strong>New sticker designs</strong> — We added a tiny avocado set and a golden retriever collection that we're very proud of. Starting at $5.</p><p><a href="https://rocketboogie.com/shop">Browse the new arrivals →</a></p><p>As always, thank you for supporting a small, independent art studio. It genuinely means the world.</p><p>— Scott &amp; the Rocket Boogie team</p>`,
  },
  {
    id: 'hero',
    name: 'Product Spotlight',
    description: 'Full-width image + focused copy for one standout product',
    hasImage: true,
    defaultSubject: 'Meet our newest California print →',
    defaultPreviewText: 'Fresh from the studio and ready to hang',
    defaultContent: `<h2>Just added: Big Sur at Golden Hour</h2><p>There's something about the California coast that never gets old — the fog rolling in over the hills, the way the light turns everything copper at dusk. This new print tries to capture exactly that.</p><p><strong>Available in two sizes:</strong><br>8×10 — $24<br>11×14 — $34</p><p>Printed on smooth matte archival paper. Ships in a flat rigid mailer, ready to frame.</p><p><a href="https://rocketboogie.com/shop">Shop this print →</a></p><p>Questions? Just reply to this email — we read every one.</p>`,
  },
  {
    id: 'editorial',
    name: 'Studio Letter',
    description: 'Personal note from the artist — story-driven, long-form',
    hasImage: false,
    defaultSubject: 'A note from the studio',
    defaultPreviewText: "We've been thinking about California again",
    defaultContent: `<h2>What I've been working on</h2><p>Every few months I like to write one of these. Not a newsletter exactly — more of a letter from the studio to the people who've been kind enough to follow along.</p><p>This month has been about California. Specifically, the way California looks in my head: palm trees that are slightly too tall, sunsets that are slightly too pink, ocean waves that are somehow both calm and wild at once.</p><p>The new prints came out of a long drive up PCH. I stopped a lot, took photos, made notes in my phone. Then I went back to the studio and tried to draw what I <em>remembered</em> rather than what I photographed. That's where the good stuff lives — in the gap between memory and reality.</p><p>If any of this resonates, the new California collection is live in the shop. I think you'll like it.</p><p>Thank you for being here. Really.</p><p>— Scott</p>`,
  },
  {
    id: 'announcement',
    name: 'New Drop',
    description: 'Bold coral header — perfect for launches and collection releases',
    hasImage: false,
    defaultSubject: "New collection just dropped 🎉",
    defaultPreviewText: 'Twelve new California designs, available now',
    defaultContent: `<h2>Introducing: California Dreamin'</h2><p>We've been sitting on these for a while and we are <em>so</em> excited to finally share them with you.</p><p>Say hello to our biggest California print series yet — twelve new illustrations celebrating everything from Big Sur to the San Fernando Valley.</p><ul><li>12 new original illustrations</li><li>Available in 8×10 ($24) and 11×14 ($34)</li><li>Archival matte paper, ships flat</li><li>Free shipping on orders over $50</li></ul><p>These are limited runs — once they're gone, they're gone. We don't reprint.</p><p><a href="https://rocketboogie.com/shop">Shop the California Dreamin' collection →</a></p>`,
  },
  {
    id: 'split',
    name: 'Category Feature',
    description: 'Image beside content — perfect for stickers, a collection, or seasonal picks',
    hasImage: true,
    defaultSubject: 'Have you seen our sticker collection?',
    defaultPreviewText: '30+ designs, starting at $5',
    defaultContent: `<h2>Stickers for everything</h2><p>We've got over 30 sticker designs in the shop right now — from tiny tacos to California poppies to a very distinguished-looking french bulldog named Gerald.</p><p>Each sticker is printed on premium waterproof vinyl with clean edges. Great for water bottles, laptops, planners — basically anything that could use a little personality.</p><p><strong>Sticker packs start at $5.</strong> Mix and match any of our designs.</p><p><a href="https://rocketboogie.com/shop">Browse all stickers →</a></p>`,
  },
  {
    id: 'minimal',
    name: 'Personal Note',
    description: 'Near plain-text — like a real letter from a real person',
    hasImage: false,
    defaultSubject: 'Hey — just a quick note',
    defaultPreviewText: 'A quiet thank you from Rocket Boogie',
    defaultContent: `<p>Hey — just wanted to say thanks.</p><p>I know you've got a full inbox, so I'll keep this short. You signed up for updates from Rocket Boogie a while ago, and I just wanted to check in and share something I've been proud of lately.</p><p>We just crossed 500 orders. For a one-person art studio, that feels huge. Every single one of those orders came from someone who found something they liked enough to buy — and that genuinely makes me happy every time.</p><p>If there's something you've been eyeing in the shop, now's a good time. I'm running a quiet <strong>15% off</strong> this week for newsletter subscribers — use code THANKYOU at checkout.</p><p><a href="https://rocketboogie.com/shop">Visit the shop →</a></p><p>With gratitude,<br>Scott</p>`,
  },
]

// ─── Shared pieces ─────────────────────────────────────────────────────────────

function legalFooter(unsubscribeUrl: string, physicalAddress: string) {
  return `
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:40px;">
    <tr>
      <td style="border-top:1px solid #e5dfd6;padding-top:28px;text-align:center;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;line-height:1.9;color:#b0a99e;">
        <p style="margin:0 0 3px;font-weight:600;color:#8a8078;">Rocket Boogie Co.</p>
        <p style="margin:0 0 3px;">${physicalAddress}</p>
        <p style="margin:0 0 10px;">You're receiving this because you subscribed to Rocket Boogie Co. updates.</p>
        <p style="margin:0;"><a href="${unsubscribeUrl}" style="color:#b0a99e;text-decoration:underline;font-size:11px;">Unsubscribe</a></p>
      </td>
    </tr>
  </table>`
}

function previewSnippet(text: string | null) {
  if (!text) return ''
  const pad = '&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;'
  return `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${text}${pad}</div>`
}

function logoImg(siteUrl: string, height = 48) {
  const width = Math.round(height * (560 / 312))
  return `<img src="${siteUrl}/logo.png" alt="Rocket Boogie Co." width="${width}" height="${height}" style="display:block;border:none;height:${height}px;width:auto;max-width:${width}px;">`
}

const bodyContentStyles = `
  .rb-content p { margin:0 0 16px; }
  .rb-content p:last-child { margin-bottom:0; }
  .rb-content h2 { font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:400;margin:0 0 12px;color:#1a1a1a;line-height:1.3; }
  .rb-content h3 { font-family:Georgia,'Times New Roman',serif;font-size:17px;font-weight:400;margin:0 0 10px;color:#1a1a1a;line-height:1.3; }
  .rb-content ul,
  .rb-content ol  { padding-left:22px;margin:0 0 16px; }
  .rb-content li  { margin-bottom:5px; }
  .rb-content strong { font-weight:600; }
  .rb-content em { font-style:italic; }
  .rb-content a  { color:#1a1a1a;text-decoration:underline; }
  .rb-content blockquote { border-left:3px solid #ffaaaa;margin:0 0 16px;padding:6px 0 6px 14px;font-style:italic;color:#555; }
  .rb-content img { max-width:100%;height:auto;display:block;border-radius:6px;margin:8px 0; }
`

// ─── Template builders ────────────────────────────────────────────────────────

export type TemplateBuildOpts = {
  subject: string
  previewText: string | null
  bodyContent: string
  imageUrl: string | null
  siteUrl: string
  unsubscribeUrl: string
  physicalAddress: string
  /** When true, skips mobile-responsive CSS so the preview renders desktop layout */
  isPreview?: boolean
}

export function buildTemplateHtml(templateId: TemplateId, opts: TemplateBuildOpts): string {
  switch (templateId) {
    case 'hero':         return heroTemplate(opts)
    case 'editorial':    return editorialTemplate(opts)
    case 'announcement': return announcementTemplate(opts)
    case 'split':        return splitTemplate(opts)
    case 'minimal':      return minimalTemplate(opts)
    default:             return classicTemplate(opts)
  }
}

// ─── 1. The Roundup (Classic) ─────────────────────────────────────────────────

function classicTemplate({ subject, previewText, bodyContent, siteUrl, unsubscribeUrl, physicalAddress }: TemplateBuildOpts) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${subject}</title>
  <style>${bodyContentStyles}</style>
</head>
<body style="margin:0;padding:0;background-color:#faf9f6;">
  ${previewSnippet(previewText)}
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf9f6;">
    <tr>
      <td align="center" style="padding:48px 20px 40px;">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <a href="${siteUrl}" style="text-decoration:none;display:inline-block;line-height:0;">
                ${logoImg(siteUrl, 48)}
              </a>
            </td>
          </tr>

          <!-- Rule -->
          <tr>
            <td style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="height:1px;background:#e5dfd6;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body card -->
          <tr>
            <td style="background:#ffffff;border-radius:12px;padding:40px 36px;color:#1a1a1a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.75;">
              <div class="rb-content">${bodyContent}</div>
            </td>
          </tr>

          <!-- Legal footer -->
          <tr>
            <td>${legalFooter(unsubscribeUrl, physicalAddress)}</td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─── 2. Product Spotlight (Hero Image) ────────────────────────────────────────

function heroTemplate({ subject, previewText, bodyContent, imageUrl, siteUrl, unsubscribeUrl, physicalAddress }: TemplateBuildOpts) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${subject}</title>
  <style>${bodyContentStyles}</style>
</head>
<body style="margin:0;padding:0;background-color:#faf9f6;">
  ${previewSnippet(previewText)}
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf9f6;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;border-radius:14px;overflow:hidden;">

          <!-- Hero image -->
          <tr>
            <td style="background:#f0ebe3;line-height:0;font-size:0;">
              ${imageUrl
                ? `<img src="${imageUrl}" alt="" width="600" style="display:block;width:100%;max-width:600px;height:320px;object-fit:cover;border:none;">`
                : `<table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td align="center" style="height:280px;background:linear-gradient(135deg,#ffaaaa 0%,#fac0a8 50%,#f9d4b8 100%);font-family:Georgia,serif;font-size:14px;color:#1a1a1a;opacity:0.6;padding:20px;">← Pick an image above to fill this area</td></tr></table>`
              }
            </td>
          </tr>

          <!-- Coral logo strip -->
          <tr>
            <td align="center" style="background:#ffaaaa;padding:14px 20px;">
              <a href="${siteUrl}" style="text-decoration:none;display:inline-block;line-height:0;">
                ${logoImg(siteUrl, 40)}
              </a>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px 36px;color:#1a1a1a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.75;">
              <div class="rb-content">${bodyContent}</div>
            </td>
          </tr>

          <!-- Warm footer background -->
          <tr>
            <td style="background:#faf9f6;padding:0 36px 36px;">
              ${legalFooter(unsubscribeUrl, physicalAddress)}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─── 3. Studio Letter (Editorial) ─────────────────────────────────────────────

function editorialTemplate({ subject, previewText, bodyContent, siteUrl, unsubscribeUrl, physicalAddress }: TemplateBuildOpts) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${subject}</title>
  <style>
    ${bodyContentStyles}
    .rb-content p { color:#333; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#faf9f6;">
  ${previewSnippet(previewText)}
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf9f6;">
    <tr>
      <td align="center" style="padding:52px 20px 40px;">
        <table cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;">

          <!-- Small wordmark -->
          <tr>
            <td style="padding-bottom:36px;">
              <a href="${siteUrl}" style="text-decoration:none;display:inline-block;line-height:0;opacity:0.6;">
                ${logoImg(siteUrl, 32)}
              </a>
            </td>
          </tr>

          <!-- Accent rule -->
          <tr>
            <td style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="width:48px;height:3px;background:#ffaaaa;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="color:#1a1a1a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.8;">
              <div class="rb-content">${bodyContent}</div>
            </td>
          </tr>

          <!-- Legal footer -->
          <tr>
            <td>${legalFooter(unsubscribeUrl, physicalAddress)}</td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─── 4. New Drop (Announcement) ───────────────────────────────────────────────

function announcementTemplate({ subject, previewText, bodyContent, siteUrl, unsubscribeUrl, physicalAddress }: TemplateBuildOpts) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${subject}</title>
  <style>${bodyContentStyles}</style>
</head>
<body style="margin:0;padding:0;background-color:#faf9f6;">
  ${previewSnippet(previewText)}
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf9f6;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">

          <!-- Coral announcement header -->
          <tr>
            <td align="center" style="background:#ffaaaa;border-radius:12px 12px 0 0;padding:40px 36px 36px;">
              <a href="${siteUrl}" style="text-decoration:none;display:inline-block;line-height:0;">
                ${logoImg(siteUrl, 40)}
              </a>
            </td>
          </tr>

          <!-- White body card -->
          <tr>
            <td style="background:#ffffff;border-radius:0 0 12px 12px;padding:40px 36px;color:#1a1a1a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.75;">
              <div class="rb-content">${bodyContent}</div>
            </td>
          </tr>

          <!-- Legal footer -->
          <tr>
            <td>${legalFooter(unsubscribeUrl, physicalAddress)}</td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─── 5. Category Feature (Split) ──────────────────────────────────────────────
// Two-column: image left, text right. isPreview skips the mobile media query
// so the admin preview renders the desktop two-column layout correctly.

function splitTemplate({ subject, previewText, bodyContent, imageUrl, siteUrl, unsubscribeUrl, physicalAddress, isPreview }: TemplateBuildOpts) {
  const mobileStyles = isPreview ? '' : `
    @media only screen and (max-width:600px) {
      .split-image { display:none !important; }
      .split-content { width:100% !important; }
    }`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${subject}</title>
  <style>
    ${bodyContentStyles}
    ${mobileStyles}
  </style>
</head>
<body style="margin:0;padding:0;background-color:#faf9f6;">
  ${previewSnippet(previewText)}
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf9f6;">
    <tr>
      <td align="center" style="padding:44px 20px 40px;">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:24px;">
              <a href="${siteUrl}" style="text-decoration:none;display:inline-block;line-height:0;">
                ${logoImg(siteUrl, 44)}
              </a>
            </td>
          </tr>

          <!-- Rule -->
          <tr>
            <td style="padding-bottom:28px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="height:1px;background:#e5dfd6;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Split row -->
          <tr>
            <td style="background:#ffffff;border-radius:12px;overflow:hidden;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <!-- Image column -->
                  <td class="split-image" width="260" valign="top" style="width:260px;line-height:0;font-size:0;">
                    ${imageUrl
                      ? `<img src="${imageUrl}" alt="" width="260" style="display:block;width:260px;min-height:300px;object-fit:cover;border:none;">`
                      : `<table cellpadding="0" cellspacing="0" border="0" width="260"><tr><td align="center" style="width:260px;height:300px;background:linear-gradient(160deg,#ffaaaa 0%,#fdd5c0 100%);font-family:Georgia,serif;font-size:12px;color:#1a1a1a;padding:20px;vertical-align:middle;">← Pick an image above</td></tr></table>`
                    }
                  </td>
                  <!-- Text column -->
                  <td class="split-content" valign="top" style="padding:36px 28px;color:#1a1a1a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.75;">
                    <div class="rb-content">${bodyContent}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Legal footer -->
          <tr>
            <td>${legalFooter(unsubscribeUrl, physicalAddress)}</td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─── 6. Personal Note (Minimal) ───────────────────────────────────────────────

function minimalTemplate({ subject, previewText, bodyContent, siteUrl, unsubscribeUrl, physicalAddress }: TemplateBuildOpts) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${subject}</title>
  <style>
    ${bodyContentStyles}
    .rb-content p { color:#2a2a2a; }
    .rb-content a { color:#2a2a2a; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#faf9f6;">
  ${previewSnippet(previewText)}
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf9f6;">
    <tr>
      <td align="left" style="padding:56px 40px 40px;max-width:560px;">
        <table cellpadding="0" cellspacing="0" border="0" width="520" style="max-width:520px;width:100%;">

          <!-- Tiny wordmark -->
          <tr>
            <td style="padding-bottom:32px;">
              <a href="${siteUrl}" style="text-decoration:none;display:inline-block;line-height:0;opacity:0.55;">
                ${logoImg(siteUrl, 36)}
              </a>
            </td>
          </tr>

          <!-- Thin rule -->
          <tr>
            <td style="padding-bottom:36px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="height:1px;background:#e0dbd2;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body — no card, just text -->
          <tr>
            <td style="color:#2a2a2a;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.85;">
              <div class="rb-content">${bodyContent}</div>
            </td>
          </tr>

          <!-- Legal footer -->
          <tr>
            <td>${legalFooter(unsubscribeUrl, physicalAddress)}</td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
