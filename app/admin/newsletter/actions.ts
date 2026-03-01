'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { revalidatePath } from 'next/cache'

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

export async function createCampaign(subject: string, contentHtml: string, previewText?: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('newsletter_campaigns')
    .insert({ subject, content_html: contentHtml, preview_text: previewText || null })
    .select('id')
    .single()
  if (error) throw error
  revalidatePath('/admin/newsletter')
  return data.id as string
}

export async function updateCampaign(id: string, subject: string, contentHtml: string, previewText?: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('newsletter_campaigns')
    .update({ subject, content_html: contentHtml, preview_text: previewText || null, updated_at: new Date().toISOString() })
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

  // Resend batch limit is 100 emails per call
  const BATCH_SIZE = 100
  let sentCount = 0

  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE)
    const emails = batch.map(sub => ({
      from: FROM_EMAIL,
      to: sub.email,
      subject: campaign.subject,
      html: buildEmailHtml(campaign.content_html, sub.unsubscribe_token, campaign.subject, campaign.preview_text),
    }))
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

// ─── Public actions (no auth required) ───────────────────────────────────────

export async function publicSubscribe(email: string, name?: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('newsletter_subscribers')
    .upsert(
      { email: email.toLowerCase().trim(), name: name || null, source: 'signup_form', status: 'subscribed' },
      { onConflict: 'email' }
    )
  if (error) throw error
}

export async function unsubscribeByToken(token: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
    .eq('unsubscribe_token', token)
  if (error) throw error
}

// ─── Email template ───────────────────────────────────────────────────────────

function buildEmailHtml(contentHtml: string, unsubscribeToken: string, subject: string, previewText?: string | null) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const unsubscribeUrl = `${siteUrl}/unsubscribe?token=${unsubscribeToken}`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#faf9f6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}</div>` : ''}
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">

    <div style="text-align:center;margin-bottom:32px;">
      <a href="${siteUrl}" style="text-decoration:none;color:#1a1a1a;font-size:20px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;">
        Rocket Boogie Co.
      </a>
    </div>

    <div style="background:#ffffff;border-radius:8px;padding:40px;color:#333333;line-height:1.7;font-size:15px;">
      ${contentHtml}
    </div>

    <div style="text-align:center;margin-top:32px;color:#999999;font-size:12px;line-height:1.8;">
      <p style="margin:0 0 4px;">You're receiving this because you subscribed to Rocket Boogie Co. updates.</p>
      <p style="margin:0;"><a href="${unsubscribeUrl}" style="color:#999999;text-decoration:underline;">Unsubscribe</a></p>
    </div>

  </div>
</body>
</html>`
}
