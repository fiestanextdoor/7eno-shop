import type { MetadataRoute } from 'next'
import { getShopProducts, type ShopProduct } from '@/lib/catalog'
import { DROPS, currentTimeMs, getDropStatus, isDropListed } from '@/lib/drops'
import { BASE_URL } from '@/lib/seo'

// Refresh hourly so products added in Printful appear without a redeploy, and
// a teaser product joins the sitemap within the hour after its release.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const nowMs = currentTimeMs()
  const now = new Date(nowMs)

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/shop`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/archive`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/size-guide`, lastModified: now, changeFrequency: 'monthly', priority: 0.65 },
    { url: `${BASE_URL}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.65 },
    { url: `${BASE_URL}/returns`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Collection landings rank for "Olympian" and "OLYMPN Sport", also before
  // a teaser drop is out (the landing carries the countdown and waitlist).
  const collectionPages: MetadataRoute.Sitemap = DROPS.filter((d) => isDropListed(d, nowMs)).map((d) => ({
    url: `${BASE_URL}/collections/${d.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: getDropStatus(d, nowMs) === 'live' ? 0.9 : 0.85,
  }))

  let products: ShopProduct[] = []
  try {
    products = await getShopProducts(nowMs)
  } catch {
    // Catalogue unavailable: still serve the static pages.
  }

  // Product pages of live drops only. A teaser page is noindex and stays out.
  const productPages: MetadataRoute.Sitemap = products
    .filter((p) => p.status === 'live')
    .map((p) => ({
      url: `${BASE_URL}/shop/${p.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
      ...(p.thumbnailUrl ? { images: [p.thumbnailUrl] } : {}),
    }))

  return [...staticPages, ...collectionPages, ...productPages]
}
