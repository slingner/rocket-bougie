/**
 * One-time script to get a Faire OAuth access token for your brand.
 *
 * Steps:
 *   1. Run: ngrok http 3001
 *   2. Open the ngrok HTTPS URL in your browser once (just to set the bypass cookie), then close it
 *   3. Run: npx dotenv-cli -e .env.local -- npx tsx scripts/faire-auth.ts
 *   4. Open the printed URL, authorize, and the token will appear in your terminal
 */

import http from 'http'
import { URL } from 'url'
import crypto from 'crypto'

const APP_ID = process.env.FAIRE_APPLICATION_ID
const APP_SECRET = process.env.FAIRE_APPLICATION_SECRET
const PORT = 3001
const REDIRECT_URL = 'https://cdec-24-5-255-202.ngrok-free.app/callback'
const SCOPES = ['READ_PRODUCTS', 'WRITE_PRODUCTS', 'READ_INVENTORIES', 'WRITE_INVENTORIES']

if (!APP_ID || !APP_SECRET) {
  console.error('ERROR: Missing FAIRE_APPLICATION_ID or FAIRE_APPLICATION_SECRET in .env.local')
  process.exit(1)
}

const state = crypto.randomBytes(16).toString('hex')

const params = new URLSearchParams({
  applicationId: APP_ID,
  state,
  redirectUrl: REDIRECT_URL,
})
for (const scope of SCOPES) {
  params.append('scope', scope)
}
const authUrl = `https://faire.com/oauth2/authorize?${params}`

console.log('\nOpen this URL in your browser and authorize your brand:\n')
console.log(authUrl)
console.log('\nWaiting for callback...\n')

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url!, `http://localhost:${PORT}`)

  console.log('Received:', req.url)

  if (url.pathname !== '/callback') {
    res.end('Not found')
    return
  }

  const returnedState = url.searchParams.get('state')
  const code = url.searchParams.get('authorization_code') ?? url.searchParams.get('code')

  if (!code) {
    res.end('No authorization code received. Check the terminal.')
    console.log('All params received:', Object.fromEntries(url.searchParams))
    return
  }

  if (returnedState !== state) {
    res.end('State mismatch — try running the script again.')
    console.error(`State mismatch. Expected: ${state}, got: ${returnedState}`)
    server.close()
    return
  }

  console.log('Code received, exchanging for token...')

  try {
    const tokenRes = await fetch('https://www.faire.com/api/external-api-oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        application_token: APP_ID,
        application_secret: APP_SECRET,
        redirect_url: REDIRECT_URL,
        scope: SCOPES,
        grant_type: 'AUTHORIZATION_CODE',
        authorization_code: code,
      }),
    })

    const data = await tokenRes.json() as Record<string, unknown>

    if (!tokenRes.ok) {
      res.end('Token exchange failed. Check the terminal.')
      console.error('Token exchange failed:', data)
      server.close()
      return
    }

    const token = data.access_token as string
    res.end('Done! You can close this tab and check your terminal.')
    console.log('\nAdd this to your .env.local:\n')
    console.log(`FAIRE_ACCESS_TOKEN=${token}`)
    console.log()
    server.close()
  } catch (err) {
    res.end('Something went wrong. Check the terminal.')
    console.error('Error:', err)
    server.close()
  }
})

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`)
})
