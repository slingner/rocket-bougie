import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { saveTokens, TOKEN_KEYS } from '@/lib/etsy'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/admin/etsy?error=auth_denied`)
  }

  // Retrieve stored PKCE verifier
  const db = createAdminClient()
  const { data } = await db
    .from('app_settings')
    .select('value')
    .eq('key', TOKEN_KEYS.pkceVerifier)
    .single()

  if (!data?.value) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/admin/etsy?error=no_verifier`)
  }

  const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/etsy/callback`
  const resp = await fetch('https://api.etsy.com/v3/public/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.ETSY_API_KEYSTRING!,
      redirect_uri: callbackUrl,
      code,
      code_verifier: data.value,
    }),
  })

  if (!resp.ok) {
    const text = await resp.text()
    console.error('Etsy token exchange failed:', text)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/admin/etsy?error=token_exchange`)
  }

  const json = await resp.json()
  const expiresAt = Date.now() + json.expires_in * 1000
  await saveTokens(json.access_token, json.refresh_token, expiresAt)

  await db.from('app_settings').delete().eq('key', TOKEN_KEYS.pkceVerifier)

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/admin/etsy?connected=1`)
}
