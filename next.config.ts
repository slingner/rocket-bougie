import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Cache optimized images for 31 days — product images rarely change
    minimumCacheTTL: 60 * 60 * 24 * 31,

    // WebP only — AVIF encodes ~5x slower, doubles transformations for minimal gain
    formats: ['image/webp'],

    // Single quality level — prevents generating multiple variants per image
    qualities: [75],

    // Narrowed to actual breakpoints used on the site
    // (defaults include 2048, 3840 which we never need)
    deviceSizes: [640, 828, 1080, 1200, 1920],

    // For fixed-width images (logo, nav thumbnails, cart thumbnails)
    imageSizes: [64, 128, 256, 384],

    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/sign/**',
      },
    ],
  },
}

export default nextConfig
