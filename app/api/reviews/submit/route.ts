import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { reviewNotificationHtml, reviewNotificationSubject } from '@/emails/review-notification'

function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'https://rocketboogie.com'
}

export async function POST(req: NextRequest) {
  const { token, rating, body, customerName } = await req.json()

  if (!token || typeof rating !== 'number' || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Invalid submission' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Lock: fetch and verify the token hasn't been used
  const { data: review } = await supabase
    .from('reviews')
    .select('id, token_used, product_id, products ( title )')
    .eq('review_token', token)
    .single()

  if (!review) {
    return NextResponse.json({ error: 'Invalid review link' }, { status: 404 })
  }
  if (review.token_used) {
    return NextResponse.json({ error: 'This review link has already been used' }, { status: 409 })
  }

  const { error } = await supabase
    .from('reviews')
    .update({
      rating,
      body: body || null,
      customer_name: customerName || 'Anonymous',
      token_used: true,
      status: 'pending',
    })
    .eq('id', review.id)

  if (error) {
    console.error('Failed to save review:', error)
    return NextResponse.json({ error: 'Failed to save review' }, { status: 500 })
  }

  // Notify admin
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productTitle = (review.products as any)?.title ?? 'Unknown product'
    const adminUrl = `${siteUrl()}/admin/reviews`

    await resend.emails.send({
      from: FROM_EMAIL,
      to: process.env.ADMIN_EMAIL!,
      subject: reviewNotificationSubject(productTitle, rating),
      html: reviewNotificationHtml({
        productTitle,
        rating,
        body: body || null,
        customerName: customerName || 'Anonymous',
        adminUrl,
      }),
    })
  } catch (emailErr) {
    console.error('Failed to send review notification:', emailErr)
  }

  return NextResponse.json({ ok: true })
}
