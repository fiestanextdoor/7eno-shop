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
// Live bundles. productId values are real Printful sync-product ids (see
// `scripts/list-products.mjs` to re-list them). Each set: tee + shorts, €5 off.
// ─────────────────────────────────────────────────────────────────────────────
const BUNDLES: Bundle[] = [
  {
    id: 'ink-butter-sport-set',
    title: 'Ink/Butter Sport Set',
    description: 'Matching Ink/Butter sport tee and shorts.',
    discountCents: 500,
    products: [
      { provider: 'printful', productId: '433345476', slug: 'ink-butter-sport-tee-unisex' },
      { provider: 'printful', productId: '433351405', slug: 'ink-butter-sport-shorts-unisex' },
    ],
  },
  {
    id: 'ink-blood-sport-set',
    title: 'Ink/Blood Sport Set',
    description: 'Matching Ink/Blood sport tee and shorts.',
    discountCents: 500,
    products: [
      { provider: 'printful', productId: '433345518', slug: 'ink-blood-sport-tee-unisex' },
      { provider: 'printful', productId: '433350977', slug: 'ink-blood-sport-shorts-unisex' },
    ],
  },
]

// Dev-time guard: a bundle definition must not list the same product twice
// (the discount membership check assumes one item per distinct product).
if (process.env.NODE_ENV !== 'production') {
  for (const b of BUNDLES) {
    const ids = b.products.map((p) => p.productId)
    if (new Set(ids).size !== ids.length) {
      throw new Error(`Bundle "${b.id}" contains duplicate productIds`)
    }
  }
}

export function getBundles(): Bundle[] {
  return [...BUNDLES]
}

export function getBundle(id: string): Bundle | null {
  return BUNDLES.find((b) => b.id === id) ?? null
}

/** The URL slug for a bundle is its id. */
export function getBundleBySlug(slug: string): Bundle | null {
  return getBundle(slug)
}

/** Bundles that contain the given product, matched by productId or slug. */
export function getBundlesForProduct(ref: { productId?: string; slug?: string }): Bundle[] {
  return BUNDLES.filter((b) =>
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
