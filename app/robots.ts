import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: ['Googlebot', 'Bingbot', 'Slurp', 'DuckDuckBot', 'Baiduspider', 'YandexBot', 'facebot', 'ia_archiver'],
        allow: '/',
      },
      {
        userAgent: '*',
        disallow: '/',
      },
    ],
    sitemap: 'https://rocketboogie.com/sitemap.xml',
  }
}
