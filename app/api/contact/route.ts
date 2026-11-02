import { resend } from '@/lib/resend'

// Real people take at least a few seconds to fill out the form
const MIN_FILL_TIME_MS = 3000

/**
 * Catches the random-letter junk spam bots send, like "jKFmesMjsQylqEPDPrRzDv":
 * one long "word" with no spaces that keeps flipping between lowercase and uppercase.
 * Real names like "McDonald" only flip once or twice.
 */
function looksLikeGibberish(text: string): boolean {
  const trimmed = text.trim()
  if (trimmed.includes(' ') || trimmed.length < 10) return false
  const caseFlips = trimmed.match(/[a-z][A-Z]/g)?.length ?? 0
  return caseFlips >= 3
}

function isSpam(body: Record<string, unknown>): boolean {
  const { name, message, website, startedAt } = body

  // Honeypot field is hidden from people — only bots fill it in
  if (website) return true

  // Missing timestamp means the request didn't come from our form (bot posting straight to the API)
  if (typeof startedAt !== 'number' || startedAt <= 0) return true
  if (Date.now() - startedAt < MIN_FILL_TIME_MS) return true

  if (looksLikeGibberish(String(name)) || looksLikeGibberish(String(message))) return true

  return false
}

export async function POST(req: Request) {
  const body = await req.json()
  const { name, email, subject, message } = body

  if (!name || !email || !message) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Pretend it worked so bots don't learn they were blocked
  if (isSpam(body)) {
    return Response.json({ ok: true })
  }

  try {
    await resend.emails.send({
      from: 'Rocket Boogie Co. <hello@rocketboogie.com>',
      to: 'hello@rocketboogie.com',
      replyTo: email,
      subject: subject ? `Contact: ${subject}` : `Contact form message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    })

    return Response.json({ ok: true })
  } catch (err) {
    console.error('Contact form error:', err)
    return Response.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
