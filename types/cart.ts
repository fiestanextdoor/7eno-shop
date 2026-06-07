import type { Provider } from '@/types/catalog'

export interface CartItem {
  provider: Provider
  variantId: string
  productId: string
  productName: string
  variantName: string
  price: string
  currency: string
  quantity: number
  imageUrl: string | null
  /** Set this item belongs to. Undefined for a standalone purchase. */
  bundleId?: string
  /** Display label for the set, shown grouped in the cart. */
  bundleTitle?: string
}
