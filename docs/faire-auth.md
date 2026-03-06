# Getting a Faire OAuth Access Token

Run this when your `FAIRE_ACCESS_TOKEN` expires or you need to regenerate it.

## What you need

- `FAIRE_APPLICATION_ID` and `FAIRE_APPLICATION_SECRET` in `.env.local` (from developers.faire.com)
- ngrok installed (`brew install ngrok`)

## Steps

### 1. Start ngrok

In a separate terminal:

```bash
ngrok http 3001
```

Leave it running. The URL will look like `https://xxxx-xx-xx-xxx-xxx.ngrok-free.app`.

If the URL changed since last time, update `REDIRECT_URL` in `scripts/faire-auth.ts`:

```ts
const REDIRECT_URL = 'https://your-new-ngrok-url.ngrok-free.app/callback'
```

### 2. Run the auth script

```bash
npx dotenv-cli -e .env.local -- npx tsx scripts/faire-auth.ts
```

### 3. Prime the ngrok bypass cookie

While the script is running and listening, open the ngrok base URL (e.g. `https://xxxx.ngrok-free.app`) in your browser. You'll see an ngrok warning page — click **Visit Site**. This sets a cookie that prevents ngrok from intercepting the OAuth redirect later.

### 4. Authorize on Faire

Copy the URL printed by the script and open it in your browser. You'll see a Faire permissions page listing the scopes being requested. Click **Authorize**.

### 5. Copy the token

The terminal will print:

```
Add this to your .env.local:

FAIRE_ACCESS_TOKEN=oaa_...
```

Paste that line into `.env.local`.

## Notes

- The script uses separate `scope` params (not comma-joined) — this is required for Faire's auth page to display permissions correctly
- Faire returns the code as `authorization_code` in the callback, not `code`
- Authorization codes expire in 10 minutes — if the exchange fails, just run the script again
- The ngrok URL changes every time you restart ngrok (free tier) — update `REDIRECT_URL` in the script when it does
- API calls use two headers: `X-FAIRE-APP-CREDENTIALS` (base64 of `appId:appSecret`) and `X-FAIRE-OAUTH-ACCESS-TOKEN`
