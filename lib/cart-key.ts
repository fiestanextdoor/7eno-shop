import type { Provider } from '@/types/catalog'

/** Stable cart key: variant ids can collide across providers, so include both. */
export function cartItemKey(provider: Provider, variantId: string): string {
  return `${provider}:${variantId}`
}
