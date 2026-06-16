import type { MetadataRoute } from 'next'

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.7eno.shop').replace(/\/+$/, '')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/account/', '/api/', '/auth/', '/checkout', '/success', '/coming-soon'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
