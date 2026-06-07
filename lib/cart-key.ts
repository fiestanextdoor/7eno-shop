import type { Provider } from '@/types/catalog'

/**
 * Stable cart key. Variant ids can collide across providers (and, for some POD
 * providers, across products), so include provider, and for set items also the
 * bundle and product, so two items in one set never merge.
 */
export function cartItemKey(provider: Provider, variantId: string, bundleId?: string, productId?: string): string {
  const base = `${provider}:${variantId}`
  if (!bundleId) return base
  return productId ? `${base}#${bundleId}:${productId}` : `${base}#${bundleId}`
}
