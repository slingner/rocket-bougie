'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { revalidatePath } from 'next/cache'
import { buildTemplateHtml, type TemplateId } from './email-templates'
import { buildWelcomeEmail } from '@/emails/newsletter-welcome'
import { stripe } from '@/lib/stripe'

function generateWelcomeCode(): string {
  // Avoids visually ambiguous characters (0/O, 1/I/L)
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)]
  }
  return `WELCOME${suffix}`
}

// ─── Subscribers ────────────────────────────────────────────────────────────

export async function getSubscribers() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .order('subscribed_at', { ascending: false })
  if (error) throw error
  return data
}

export async function addSubscriber(email: string, name?: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('newsletter_subscribers')
    .upsert(
      { email: email.toLowerCase().trim(), name: name || null, source: 'admin', status: 'subscribed' },
      { onConflict: 'email' }
    )
  if (error) throw error
  revalidatePath('/admin/newsletter')
}

export async function deleteSubscriber(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('newsletter_subscribers')
    .delete()
    .eq('id', id)
  if (error) throw error
  revalidatePath('/admin/newsletter')
}

// ─── Campaigns ───────────────────────────────────────────────────────────────

export async function getCampaigns() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('newsletter_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getCampaign(id: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('newsletter_campaigns')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createCampaign(
  subject: string,
  contentHtml: string,
  previewText?: string,
  templateId: TemplateId = 'classic',
  imageUrl?: string
) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('newsletter_campaigns')
    .insert({
      subject,
      content_html: contentHtml,
      preview_text: previewText || null,
      template_id: templateId,
      image_url: imageUrl || null,
    })
    .select('id')
    .single()
  if (error) throw error
  revalidatePath('/admin/newsletter')
  return data.id as string
}

export async function updateCampaign(
  id: string,
  subject: string,
  contentHtml: string,
  previewText?: string,
  templateId?: TemplateId,
  imageUrl?: string
) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('newsletter_campaigns')
    .update({
      subject,
      content_html: contentHtml,
      preview_text: previewText || null,
      ...(templateId ? { template_id: templateId } : {}),
      image_url: imageUrl !== undefined ? (imageUrl || null) : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'draft')
  if (error) throw error
  revalidatePath('/admin/newsletter')
}

export async function deleteCampaign(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('newsletter_campaigns')
    .delete()
    .eq('id', id)
    .eq('status', 'draft')
  if (error) throw error
  revalidatePath('/admin/newsletter')
}

export async function sendCampaign(id: string): Promise<number> {
  const supabase = createAdminClient()

  const { data: campaign, error: campaignError } = await supabase
    .from('newsletter_campaigns')
    .select('*')
    .eq('id', id)
    .eq('status', 'draft')
    .single()

  if (campaignError || !campaign) throw new Error('Campaign not found or already sent')

  const { data: subscribers, error: subError } = await supabase
    .from('newsletter_subscribers')
    .select('email, name, unsubscribe_token')
    .eq('status', 'subscribed')

  if (subError) throw subError
  if (!subscribers || subscribers.length === 0) throw new Error('No active subscribers')

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rocketboogie.com'
  const physicalAddress = process.env.BUSINESS_ADDRESS ?? 'San Francisco, CA'

  const BATCH_SIZE = 100
  let sentCount = 0

  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE)
    const emails = batch.map(sub => {
      const unsubscribeUrl = `${siteUrl}/unsubscribe?token=${sub.unsubscribe_token}`
      return {
        from: FROM_EMAIL,
        to: sub.email,
        subject: campaign.subject,
        html: buildTemplateHtml(campaign.template_id as TemplateId, {
          subject: campaign.subject,
          previewText: campaign.preview_text,
          bodyContent: campaign.content_html,
          imageUrl: campaign.image_url,
          siteUrl,
          unsubscribeUrl,
          physicalAddress,
        }),
      }
    })
    await resend.batch.send(emails)
    sentCount += batch.length
  }

  await supabase
    .from('newsletter_campaigns')
    .update({ status: 'sent', sent_at: new Date().toISOString(), recipient_count: sentCount })
    .eq('id', id)

  revalidatePath('/admin/newsletter')
  return sentCount
}

// ─── Image search ─────────────────────────────────────────────────────────────

export async function searchProductImages(query: string) {
  const supabase = createAdminClient()

  let productIds: string[] = []

  if (query.trim()) {
    const { data: products } = await supabase
      .from('products')
      .select('id, title')
      .ilike('title', `%${query.trim()}%`)
      .limit(30)
    productIds = products?.map(p => p.id) ?? []
    if (productIds.length === 0) return []
  }

  const q = supabase
    .from('product_images')
    .select('url, alt_text, product_id, products!inner(title)')
    .order('position', { ascending: true })
    .limit(query.trim() ? 48 : 24)

  if (productIds.length > 0) {
    q.in('product_id', productIds)
  }

  const { data } = await q

  return (data ?? []).map(img => ({
    url: img.url,
    alt: img.alt_text ?? '',
    productTitle: (img.products as unknown as { title: string } | null)?.title ?? '',
  }))
}

// ─── Public actions ───────────────────────────────────────────────────────────

export async function publicSubscribe(email: string, name?: string) {
  const supabase = createAdminClient()

  const { data: subscriber, error } = await supabase
    .from('newsletter_subscribers')
    .upsert(
      { email: email.toLowerCase().trim(), name: name || null, source: 'signup_form', status: 'subscribed' },
      { onConflict: 'email' }
    )
    .select('id, email, welcome_discount_code_id')
    .single()

  if (error) throw error

  // Don't generate a second code if they've already received one
  if (subscriber.welcome_discount_code_id) return

  try {
    const code = generateWelcomeCode()

    // Create Stripe coupon + unique single-use promotion code
    const coupon = await stripe.coupons.create({
      percent_off: 10,
      duration: 'once',
      name: 'Newsletter Welcome 10% off',
    })

    const promoCode = await stripe.promotionCodes.create({
      promotion: { type: 'coupon', coupon: coupon.id },
      code,
      max_redemptions: 1,
    })

    // Save to discount_codes
    const { data: discountRow, error: dcError } = await supabase
      .from('discount_codes')
      .insert({
        code,
        type: 'percentage',
        value: 10,
        usage_limit: 1,
        source: 'newsletter_welcome',
        stripe_coupon_id: coupon.id,
        stripe_promotion_code_id: promoCode.id,
      })
      .select('id')
      .single()

    if (dcError) {
      await stripe.promotionCodes.update(promoCode.id, { active: false }).catch(() => {})
      await stripe.coupons.del(coupon.id).catch(() => {})
      throw dcError
    }

    // Link code to subscriber
    await supabase
      .from('newsletter_subscribers')
      .update({ welcome_discount_code_id: discountRow.id })
      .eq('id', subscriber.id)

    // Send welcome email
    await resend.emails.send({
      from: FROM_EMAIL,
      to: subscriber.email,
      subject: 'Welcome to Rocket Boogie Co. — here\'s 10% off!',
      html: buildWelcomeEmail({ code }),
    })
  } catch (err) {
    // Subscriber is already added — log but don't surface the error to the user
    console.error('Failed to create welcome discount code:', err)
  }
}

export async function unsubscribeByToken(token: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
    .eq('unsubscribe_token', token)
  if (error) throw error
}
