import type { MetadataRoute } from 'next'
import { getCatalogProducts } from '@/lib/catalog'
import { getBundles } from '@/lib/bundles'
import { productSlug } from '@/lib/slug'
import { BASE_URL } from '@/lib/seo'

// Refresh hourly so products added in Printful/Printify appear without a redeploy.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/shop`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    // Collection landing pages. These are the pages that should rank for
    // "Olympian" and for the original range, so they belong in the sitemap
    // even though they are filter URLs.
    { url: `${BASE_URL}/shop?line=olympian`, lastModified: now, changeFrequency: 'daily', priority: 0.85 },
    { url: `${BASE_URL}/shop?line=og`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/shop?gender=men`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/shop?gender=women`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/deals`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    // Content landing pages: these target search demand the product pages
    // can't answer (the collection story, the brand name, sizing, FAQs).
    { url: `${BASE_URL}/olympian`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/size-guide`, lastModified: now, changeFrequency: 'monthly', priority: 0.65 },
    { url: `${BASE_URL}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.65 },
    { url: `${BASE_URL}/returns`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  let products: Awaited<ReturnType<typeof getCatalogProducts>> = []
  try {
    products = await getCatalogProducts()
  } catch {
    // Catalog unavailable (e.g. provider API down): still serve the static pages.
  }

  // `images` emits image:image entries, so product photos get discovered for
  // Google Images — a real traffic source for clothing.
  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/shop/${productSlug(p.name)}`,
    lastModified: p.createdAt ? new Date(p.createdAt.replace(' ', 'T')) : now,
    changeFrequency: 'weekly',
    priority: 0.8,
    ...(p.thumbnailUrl ? { images: [p.thumbnailUrl] } : {}),
  }))

  const bundlePages: MetadataRoute.Sitemap = getBundles().map((b) => ({
    url: `${BASE_URL}/deals/${b.id}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticPages, ...productPages, ...bundlePages]
}
