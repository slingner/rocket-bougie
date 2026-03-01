// ─── Template registry ────────────────────────────────────────────────────────

export type TemplateId = 'classic' | 'hero' | 'editorial' | 'announcement' | 'split' | 'minimal'

export type TemplateInfo = {
  id: TemplateId
  name: string
  description: string
  hasImage: boolean
}

export const TEMPLATES: TemplateInfo[] = [
  { id: 'classic',      name: 'Classic',      description: 'Centered layout with white card body',         hasImage: false },
  { id: 'hero',         name: 'Hero Image',   description: 'Full-width image with coral accent strip',      hasImage: true  },
  { id: 'editorial',    name: 'Editorial',    description: 'Big serif headline, newspaper feel',            hasImage: false },
  { id: 'announcement', name: 'Announcement', description: 'Bold coral header, great for launches',         hasImage: false },
  { id: 'split',        name: 'Split',        description: 'Image beside content, modern two-column',       hasImage: true  },
  { id: 'minimal',      name: 'Minimal',      description: 'Near plain-text, elegant and personal',         hasImage: false },
]

// ─── Shared pieces ─────────────────────────────────────────────────────────────

// CAN-SPAM + GDPR required footer — always present in every template
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

// Preview text hidden div (inbox snippet)
function previewSnippet(text: string | null) {
  if (!text) return ''
  // Pad with invisible chars so email clients don't pull in body text
  const pad = '&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;'
  return `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${text}${pad}</div>`
}

// Logo image — use absolute URL so email clients can load it
// 560×312 native; rendered at given height with auto width
function logoImg(siteUrl: string, height = 48) {
  const width = Math.round(height * (560 / 312))
  return `<img src="${siteUrl}/logo.png" alt="Rocket Boogie Co." width="${width}" height="${height}" style="display:block;border:none;height:${height}px;width:auto;max-width:${width}px;">`
}

// Shared body content styles injected in <head> for Tiptap-generated HTML
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

// ─── 1. Classic ───────────────────────────────────────────────────────────────
// Warm, centered, white card body. The reliable workhorse.

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

// ─── 2. Hero Image ────────────────────────────────────────────────────────────
// Dramatic full-width image, coral accent strip, great for product spotlights.

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
                : `<div style="height:280px;background:linear-gradient(135deg,#ffaaaa 0%,#fac0a8 50%,#f9d4b8 100%);display:flex;align-items:center;justify-content:center;">
                     <span style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#1a1a1a;opacity:0.6;">Rocket Boogie Co.</span>
                   </div>`
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

// ─── 3. Editorial ─────────────────────────────────────────────────────────────
// Big serif headline, minimal chrome, newspaper reading experience.

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

          <!-- Large serif headline -->
          <tr>
            <td style="padding-bottom:8px;">
              <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:38px;font-weight:400;color:#1a1a1a;line-height:1.18;margin:0;letter-spacing:-0.01em;">${subject}</h1>
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

// ─── 4. Announcement ─────────────────────────────────────────────────────────
// Bold coral header block, white centered card. Perfect for launches & events.

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
              <a href="${siteUrl}" style="text-decoration:none;display:inline-block;line-height:0;margin-bottom:16px;">
                ${logoImg(siteUrl, 40)}
              </a>
              <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:400;color:#1a1a1a;line-height:1.25;margin:0;letter-spacing:-0.01em;">${subject}</h1>
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

// ─── 5. Split ─────────────────────────────────────────────────────────────────
// Two-column: image left, text right. Stacks on mobile.

function splitTemplate({ subject, previewText, bodyContent, imageUrl, siteUrl, unsubscribeUrl, physicalAddress }: TemplateBuildOpts) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${subject}</title>
  <style>
    ${bodyContentStyles}
    @media only screen and (max-width:600px) {
      .split-image { display:none !important; }
      .split-content { width:100% !important; }
    }
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
                      : `<div style="width:260px;min-height:300px;background:linear-gradient(160deg,#ffaaaa 0%,#fdd5c0 100%);"></div>`
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

// ─── 6. Minimal ───────────────────────────────────────────────────────────────
// Near plain-text. A personal letter. Elegant restraint.

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
