import { getCatalogProducts, getCatalogProduct } from '@/lib/catalog'
import { classify, HIDDEN_SIZES } from '@/lib/product-classify'
import { olympianColorway } from '@/lib/color-utils'
import { productSlug } from '@/lib/slug'
import { absoluteUrl, BASE_URL, BRAND } from '@/lib/seo'
import { ALLOWED_COUNTRIES, FLAT_SHIPPING_RATE } from '@/lib/shipping'
import {
  buildTitle, genderFor, googleCategoryFor, isWearable, productTypeFor, renderFeedXml, type FeedItem,
} from '@/lib/merchant-feed'
import type { NormalizedProduct } from '@/types/catalog'

// Merchant Center fetches a feed at most once a day, so an hourly window is
// plenty and keeps the provider detail calls (one per product) off the hot path.
export const revalidate = 3600

const SHIPPING = ALLOWED_COUNTRIES.map((country) => ({
  country,
  price: `${FLAT_SHIPPING_RATE.toFixed(2)} EUR`,
}))

function describe(product: NormalizedProduct, collection: string): string {
  return (
    `${product.name} from the 7ENO (Zeno) ${collection} collection by ${BRAND.parent}. ` +
    'Premium streetwear, printed on demand. Free shipping over €75 and 14-day returns.'
  )
}

function itemsForProduct(product: NormalizedProduct): FeedItem[] {
  const c = classify(product.name)
  const slug = productSlug(product.name)
  const link = absoluteUrl(`/shop/${slug}`)
  const collection = c.isOlympian ? 'Olympian' : 'OG'
  const description = describe(product, collection)
  // Olympian publishes one product per colourway, so the garment's own variant
  // colour ("White") is not the colour a shopper searches for — the colourway
  // in the product name is.
  const colourway = olympianColorway(product.name)

  return product.variants
    .filter((v) => v.priceCents > 0 && !HIDDEN_SIZES.has(v.size))
    .map((v) => ({
      id: `${product.provider}-${v.id}`,
      itemGroupId: `${product.provider}-${product.id}`,
      title: buildTitle(product.name, colourway?.name ?? v.color, v.size),
      description,
      link,
      imageLink: v.imageUrl ?? product.thumbnailUrl ?? '',
      additionalImageLinks:
        product.thumbnailUrl && product.thumbnailUrl !== v.imageUrl ? [product.thumbnailUrl] : [],
      availability: v.inStock === false ? ('out_of_stock' as const) : ('in_stock' as const),
      price: `${(v.priceCents / 100).toFixed(2)} ${v.currency || 'EUR'}`,
      brand: BRAND.name,
      condition: 'new' as const,
      mpn: `${product.provider}-${product.id}-${v.id}`,
      googleProductCategory: googleCategoryFor(c, product.name),
      productType: productTypeFor(c),
      // Gender/age only on wearables; Google flags them on a mouse pad.
      ...(isWearable(c, product.name)
        ? { gender: genderFor(c), ageGroup: 'adult' as const }
        : {}),
      color: colourway?.name ?? v.color,
      size: v.size,
      shipping: SHIPPING,
    }))
    // An item without an image is rejected by Merchant Center, so drop it here
    // rather than shipping a feed that partially fails validation.
    .filter((item) => item.imageLink !== '')
}

export async function GET() {
  let products: NormalizedProduct[] = []
  try {
    products = await getCatalogProducts()
  } catch (err) {
    console.error('[MerchantFeed] getCatalogProducts failed:', err)
  }

  // List responses don't carry variants for every provider, so pull the detail
  // (cached) per product. A product that fails to resolve is skipped instead of
  // failing the whole feed.
  const detailed = await Promise.all(
    products.map(async (p) => {
      if (p.variants.length > 0) return p
      try {
        return await getCatalogProduct(p.provider, p.id)
      } catch {
        return null
      }
    }),
  )

  const items = detailed
    .filter((p): p is NormalizedProduct => p !== null)
    .flatMap(itemsForProduct)

  const xml = renderFeedXml(items, {
    title: '7ENO (Zeno) — Premium Streetwear',
    link: BASE_URL,
    description:
      'Product feed for 7ENO (pronounced "Zeno"), the official streetwear store by Abra Entertainment.',
  })

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
