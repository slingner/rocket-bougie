import { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/server'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rocketboogie.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient()

  const { data: products } = await supabase
    .from('products')
    .select('handle, updated_at')
    .eq('hidden', false)

  const productUrls: MetadataRoute.Sitemap = (products ?? []).map(p => ({
    url: `${siteUrl}/products/${p.handle}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${siteUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...productUrls,
  ]
}
