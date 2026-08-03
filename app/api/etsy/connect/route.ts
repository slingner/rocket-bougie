import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateCodeVerifier, generateCodeChallenge, TOKEN_KEYS } from '@/lib/etsy'

export async function GET() {
  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)

  const db = createAdminClient()
  await db.from('app_settings').upsert({
    key: TOKEN_KEYS.pkceVerifier,
    value: verifier,
    updated_at: new Date().toISOString(),
  })

  const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/etsy/callback`

  const params = new URLSearchParams({
    response_type: 'code',
    redirect_uri: callbackUrl,
    scope: 'listings_r listings_w shops_r',
    client_id: process.env.ETSY_API_KEYSTRING!,
    state: 'etsy_oauth',
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })

  return NextResponse.redirect(`https://www.etsy.com/oauth/connect?${params}`)
}
