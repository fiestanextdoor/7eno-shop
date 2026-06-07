export type Provider = 'printful' | 'printify'

export interface NormalizedVariant {
  provider: Provider
  productId: string
  id: string
  name: string
  size: string
  color: string
  colorCode: string
  priceCents: number
  currency: string
  inStock: boolean
  imageUrl: string | null
}

export interface NormalizedColor {
  color: string
  hex: string
  hex2?: string
  imageUrl?: string | null
  displayName: string
}

export interface NormalizedProduct {
  provider: Provider
  id: string
  name: string
  thumbnailUrl: string | null
  variants: NormalizedVariant[]
  colors: NormalizedColor[]
  priceCents?: number
  currency: string
}
