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
}
