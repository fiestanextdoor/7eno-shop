import type { NormalizedProduct, Provider } from '@/types/catalog'
import { productSlug } from '@/lib/slug'
import * as printful from '@/lib/printful'
import { normalizePrintfulProduct, normalizePrintfulDetail } from '@/lib/printful-normalize'
import * as printify from '@/lib/printify'
import { isUnreleasedProductName } from '@/lib/unreleased'
import {
  colourRank, currentTimeMs, familyKey, getDropStatus, isVisibleInShop, matchDrop,
  type Drop, type DropClockOptions, type DropStatus,
} from '@/lib/drops'

/**
 * Combine two providers' results. Each is a settled promise so one provider
 * failing never blanks the list (it returns the other's products instead of an
 * empty list, avoiding a cached empty page on partial failure).
 */
export function mergeCatalogs(
  pf: PromiseSettledResult<NormalizedProduct[]>,
  pi: PromiseSettledResult<NormalizedProduct[]>
): NormalizedProduct[] {
  const out: NormalizedProduct[] = []
  if (pf.status === 'fulfilled') out.push(...pf.value)
  else console.error('[Catalog] Printful fetch failed:', pf.reason)
  if (pi.status === 'fulfilled') out.push(...pi.value)
  else console.error('[Catalog] Printify fetch failed:', pi.reason)
  return out
}

/**
 * Whether a product has at least one variant in stock. A product whose
 * variants are not loaded yet (list-level Printful) counts as in stock, so it
 * is never marked sold out on missing data.
 */
export function isInStock(product: NormalizedProduct): boolean {
  if (product.variants.length === 0) return true
  return product.variants.some((v) => v.inStock !== false)
}

/** Find a product in a list by its name-based slug. */
export function findBySlug<T extends NormalizedProduct>(products: T[], slug: string): T | null {
  const matches = products.filter((p) => productSlug(p.name) === slug)
  if (matches.length === 0) return null
  if (matches.length > 1) {
    console.warn(`[Catalog] slug "${slug}" matches ${matches.length} products across providers`)
  }
  return matches[0]
}

/**
 * The raw catalogue of both providers (list level). Never render this: the
 * shop shows getShopProducts. Only used to recognise retired product URLs.
 */
export async function getCatalogProducts(): Promise<NormalizedProduct[]> {
  const [pf, pi] = await Promise.allSettled([
    printful.getProducts().then((ps) => ps.map(normalizePrintfulProduct)),
    printify.getProducts(),
  ])
  return mergeCatalogs(pf, pi).filter((p) => !isUnreleasedProductName(p.name))
}

/** A single product with full variants, fetched from the right provider. */
export async function getCatalogProduct(
  provider: Provider,
  id: string
): Promise<NormalizedProduct> {
  if (provider === 'printify') return printify.getProduct(id)
  const detail = await printful.getProduct(id)
  return normalizePrintfulDetail(detail)
}

/** A catalogue product that belongs to a drop the shop shows right now. */
export interface ShopProduct extends NormalizedProduct {
  slug: string
  drop: Drop
  /** Status on the drop clock, preview included. */
  status: DropStatus
  purchasable: boolean
  /** Every variant out of stock: shown with a badge, never hidden. */
  soldOut: boolean
}

/** Spec section 4: edition descending, then product family, then colourOrder. */
export function compareShopProducts(a: ShopProduct, b: ShopProduct): number {
  return (
    b.drop.edition - a.drop.edition ||
    familyKey(a.drop, a.name).localeCompare(familyKey(b.drop, b.name)) ||
    colourRank(a.drop, a.name) - colourRank(b.drop, b.name)
  )
}

/**
 * The allow-list: only products of a drop that is live (or upcoming with a
 * teaser) survive. OG, Printify and any unplanned product stay invisible.
 */
export function toShopProducts(
  products: NormalizedProduct[],
  now: number = currentTimeMs(),
  opts: DropClockOptions = {}
): ShopProduct[] {
  const out: ShopProduct[] = []
  for (const p of products) {
    const drop = matchDrop(p)
    if (!drop || !isVisibleInShop(drop, now, opts)) continue
    const status = getDropStatus(drop, now, opts)
    out.push({ ...p, slug: productSlug(p.name), drop, status, purchasable: status === 'live', soldOut: !isInStock(p) })
  }
  return out.sort(compareShopProducts)
}

/**
 * Everything the shop shows, with variants loaded so price and sold-out
 * state are real. Printify is not fetched: no drop matches it.
 */
export async function getShopProducts(
  now: number = currentTimeMs(),
  opts: DropClockOptions = {}
): Promise<ShopProduct[]> {
  let listed: NormalizedProduct[]
  try {
    listed = (await printful.getProducts()).map(normalizePrintfulProduct)
  } catch (err) {
    console.error('[Catalog] Printful fetch failed:', err)
    return []
  }
  return Promise.all(
    toShopProducts(listed, now, opts).map(async (p) => {
      if (p.variants.length > 0) return p
      try {
        const detail = await getCatalogProduct(p.provider, p.id)
        return { ...p, ...detail, slug: p.slug, soldOut: !isInStock(detail) }
      } catch {
        return p
      }
    })
  )
}

/** A product URL that existed but is no longer in any visible drop (OG, Printify). */
export async function isRetiredProductSlug(slug: string): Promise<boolean> {
  try {
    return findBySlug(await getCatalogProducts(), slug) !== null
  } catch {
    return false
  }
}
