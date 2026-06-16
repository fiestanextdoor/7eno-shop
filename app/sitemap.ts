import type { MetadataRoute } from 'next'
import { getCatalogProducts } from '@/lib/catalog'
import { getBundles } from '@/lib/bundles'
import { productSlug } from '@/lib/slug'

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.7eno.shop').replace(/\/+$/, '')

// Refresh hourly so products added in Printful/Printify appear without a redeploy.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/shop`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/deals`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/returns`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  let products: Awaited<ReturnType<typeof getCatalogProducts>> = []
  try {
    products = await getCatalogProducts()
  } catch {
    // Catalog unavailable (e.g. provider API down): still serve the static pages.
  }

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/shop/${productSlug(p.name)}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const bundlePages: MetadataRoute.Sitemap = getBundles().map((b) => ({
    url: `${BASE_URL}/deals/${b.id}`,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticPages, ...productPages, ...bundlePages]
}
