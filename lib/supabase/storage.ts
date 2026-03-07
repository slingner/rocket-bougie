import { unstable_cache } from 'next/cache'
import { createAdminClient } from './server'

const BUCKET = 'product-images'
const SIGNED_URL_TTL = 60 * 60 * 2 // 2 hours — signed URLs stay valid for this long

function storagePath(url: string): string | null {
  const match = url.match(/\/storage\/v1\/object\/(?:public|sign)\/product-images\/([^?]+)/)
  return match ? match[1] : null
}

// Cache signed URL generation for 1 hour so repeated renders return identical URLs.
// This lets browsers HTTP-cache the image responses across page loads.
const getCachedSignedUrls = unstable_cache(
  async (paths: string[]) => {
    const admin = createAdminClient()
    const { data, error } = await admin.storage
      .from(BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL)
    if (error) console.error('[storage] createSignedUrls failed:', error.message)
    return (data ?? []).map(item => ({ path: item.path, signedUrl: item.signedUrl }))
  },
  ['storage-signed-urls'],
  { revalidate: 60 * 60 }, // regenerate after 1 hour; URLs still valid for another hour
)

export async function signImageUrls(
  urls: (string | null)[],
): Promise<(string | null)[]> {
  const toSign: Array<{ path: string; index: number }> = []

  urls.forEach((url, i) => {
    if (!url) return
    const path = storagePath(url)
    if (path) toSign.push({ path, index: i })
  })

  if (toSign.length === 0) return urls

  const data = await getCachedSignedUrls(toSign.map(x => x.path))
  const signedByPath = new Map(data.map(item => [item.path, item.signedUrl]))

  const result = [...urls]
  toSign.forEach(({ path, index }) => {
    const signed = signedByPath.get(path)
    if (signed) result[index] = signed
  })

  return result
}
