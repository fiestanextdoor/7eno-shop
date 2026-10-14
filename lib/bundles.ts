import type { Provider } from '@/types/catalog'

/** One product slot in a set. The customer chooses the variant (size/colour). */
export interface BundleProductRef {
  provider: Provider
  productId: string // live Printful/Printify product id — must be a real id
  slug: string      // product slug, for catalog lookup + linking
}

export interface Bundle {
  id: string                   // stable key; also the URL slug for /deals/[slug]
  title: string
  description?: string
  products: BundleProductRef[] // 2+ products that make up the set
  discountCents: number        // fixed amount off the summed item prices
  image?: string               // optional hero image (/public path or remote url)
}

export interface BundlePricing {
  sumCents: number
  discountCents: number
  setCents: number
}

// ─────────────────────────────────────────────────────────────────────────────
// No live sets. Every set was built from OG products, and OG left the shop with
// the v2 rebrand (spec section 1). The pricing and discount logic stays for
// future sets; add them here with real Printful sync-product ids.
// ─────────────────────────────────────────────────────────────────────────────
const BUNDLES: Bundle[] = []

/** A set must not list the same product twice (the discount check assumes one item per product). */
export function assertUniqueBundleProducts(list: readonly Bundle[]): void {
  for (const b of list) {
    const ids = b.products.map((p) => p.productId)
    if (new Set(ids).size !== ids.length) {
      throw new Error(`Bundle "${b.id}" contains duplicate productIds`)
    }
  }
}

if (process.env.NODE_ENV !== 'production') assertUniqueBundleProducts(BUNDLES)

export function getBundles(list: readonly Bundle[] = BUNDLES): Bundle[] {
  return [...list]
}

export function getBundle(id: string, list: readonly Bundle[] = BUNDLES): Bundle | null {
  return list.find((b) => b.id === id) ?? null
}

/** The URL slug for a bundle is its id. */
export function getBundleBySlug(slug: string, list: readonly Bundle[] = BUNDLES): Bundle | null {
  return getBundle(slug, list)
}

/** Bundles that contain the given product, matched by productId or slug. */
export function getBundlesForProduct(
  ref: { productId?: string; slug?: string },
  list: readonly Bundle[] = BUNDLES
): Bundle[] {
  return list.filter((b) =>
    b.products.some(
      (p) =>
        (ref.productId !== undefined && p.productId === ref.productId) ||
        (ref.slug !== undefined && p.slug === ref.slug),
    ),
  )
}

/** Lowest variant price in cents for a product; Infinity if it has no variants. */
export function lowestVariantPriceCents(variants: { priceCents: number }[]): number {
  return variants.reduce((min, v) => (v.priceCents < min ? v.priceCents : min), Infinity)
}

/** Pure pricing: set price = summed item prices minus the discount, clamped to [0, sum]. */
export function computeBundlePricing(sumCents: number, discountCents: number): BundlePricing {
  const clamped = Math.min(Math.max(discountCents, 0), sumCents)
  return { sumCents, discountCents: clamped, setCents: sumCents - clamped }
}
