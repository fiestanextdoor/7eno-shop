import { getShopProducts, type ShopProduct } from '@/lib/catalog'
import { classify, HIDDEN_SIZES } from '@/lib/product-classify'
import { colourLabel, currentTimeMs } from '@/lib/drops'
import { absoluteUrl, BASE_URL, BRAND } from '@/lib/seo'
import { ALLOWED_COUNTRIES, FLAT_SHIPPING_RATE } from '@/lib/shipping'
import {
  buildTitle, googleCategoryFor, isWearable, productTypeFor, renderFeedXml, type FeedItem,
} from '@/lib/merchant-feed'

// Merchant Center fetches a feed at most once a day, so an hourly window is
// plenty and keeps the provider detail calls off the hot path.
export const revalidate = 3600

const SHIPPING = ALLOWED_COUNTRIES.map((country) => ({
  country,
  price: `${FLAT_SHIPPING_RATE.toFixed(2)} EUR`,
}))

function describe(product: ShopProduct): string {
  return (
    `${product.name} from the 7ENO (Zeno) ${product.drop.title} collection by ${BRAND.parent}. ` +
    'Premium streetwear, printed on demand. Free shipping over €75 and 14-day returns.'
  )
}

function itemsForProduct(product: ShopProduct): FeedItem[] {
  const c = classify(product.name)
  const link = absoluteUrl(`/shop/${product.slug}`)
  const collection = product.drop.title
  const description = describe(product)
  // Each colourway is its own product, so the colour a shopper searches for
  // is the one in the name ("Rose Red"), not Printful's garment colour.
  const colour = colourLabel(product.drop, product.name)

  return product.variants
    .filter((v) => v.priceCents > 0 && !HIDDEN_SIZES.has(v.size))
    .map((v) => ({
      id: `${product.provider}-${v.id}`,
      itemGroupId: `${product.provider}-${product.id}`,
      title: buildTitle(product.name, colour ?? v.color, v.size),
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
      googleProductCategory: googleCategoryFor(c),
      productType: productTypeFor(c, collection),
      // Every v2 piece is unisex. Gender and age only on wearables.
      ...(isWearable(c) ? { gender: 'unisex' as const, ageGroup: 'adult' as const } : {}),
      color: colour ?? v.color,
      size: v.size,
      shipping: SHIPPING,
    }))
    // An item without an image is rejected by Merchant Center.
    .filter((item) => item.imageLink !== '')
}

export async function GET() {
  let products: ShopProduct[] = []
  try {
    // No preview options: the feed only ever shows what anyone can buy now.
    products = await getShopProducts(currentTimeMs())
  } catch (err) {
    console.error('[MerchantFeed] getShopProducts failed:', err)
  }

  const items = products.filter((p) => p.status === 'live').flatMap(itemsForProduct)

  const xml = renderFeedXml(items, {
    title: '7ENO (Zeno) · Premium Streetwear',
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
