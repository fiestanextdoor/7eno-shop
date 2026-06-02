import type { NormalizedProduct, Provider } from '@/types/catalog'
import { productSlug } from '@/lib/slug'
import * as printful from '@/lib/printful'
import { normalizePrintfulProduct, normalizePrintfulDetail } from '@/lib/printful-normalize'
import * as printify from '@/lib/printify'

/**
 * Combine two providers' results. Each is a settled promise so one provider
 * failing never blanks the grid (it returns the other's products instead of an
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

/** Find a product in a merged list by its name-based slug. */
export function findBySlug(products: NormalizedProduct[], slug: string): NormalizedProduct | null {
  const matches = products.filter((p) => productSlug(p.name) === slug)
  if (matches.length === 0) return null
  if (matches.length > 1) {
    console.warn(`[Catalog] slug "${slug}" matches ${matches.length} products across providers`)
  }
  return matches[0]
}

/** All products across both providers (list-level; Printful has no variants here). */
export async function getCatalogProducts(): Promise<NormalizedProduct[]> {
  const [pf, pi] = await Promise.allSettled([
    printful.getProducts().then((ps) => ps.map(normalizePrintfulProduct)),
    printify.getProducts(),
  ])
  return mergeCatalogs(pf, pi)
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
