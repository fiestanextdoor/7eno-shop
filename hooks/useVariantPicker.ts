import { useState } from 'react'

/** Sizes the shop never offers, on the product page and in quick-add alike. */
export const HIDDEN_SIZES: ReadonlySet<string> = new Set([
  '4XL', '5XL', '6XL', '7XL', '8XL', '4X-Large', '5X-Large',
])

/** The variant fields the picker needs; NormalizedVariant and CarouselVariant both fit. */
export interface PickableVariant {
  id: string
  color: string
  size: string
  name: string
  inStock: boolean
}

export interface VariantPickerOptions<V extends PickableVariant> {
  variants: V[]
  /** Colour keys in display order. More than one turns on per-colour filtering. */
  colors: string[]
  /** Colour selected on first render. Defaults to the first colour. */
  initialColor?: string
}

export interface VariantPicker<V extends PickableVariant> {
  selectedColor: string
  hasColors: boolean
  colorVariants: V[]
  /** One variant per size (size, else name), hidden sizes removed, sold-out included. */
  sizes: V[]
  /** `sizes` without the ones that cannot be bought. */
  availableSizes: V[]
  isAvailable: (variant: V) => boolean
  selectedVariantId: string | null
  selectedVariant: V | null
  /** Switch colour; the chosen size belongs to the old colour, so it is cleared. */
  selectColor: (color: string) => void
  selectVariant: (variantId: string | null) => void
}

export function useVariantPicker<V extends PickableVariant>({
  variants,
  colors,
  initialColor,
}: VariantPickerOptions<V>): VariantPicker<V> {
  const hasColors = colors.length > 1
  const [selectedColor, setSelectedColor] = useState<string>(initialColor ?? colors[0] ?? '')
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)

  const colorVariants = hasColors && selectedColor
    ? variants.filter((v) => v.color === selectedColor)
    : variants

  // When a whole colour is out of stock (pre-sale), every size stays orderable.
  const allOutOfStock = colorVariants.length > 0 && colorVariants.every((v) => v.inStock === false)
  const isAvailable = (v: V) => (allOutOfStock ? true : v.inStock !== false)

  const sizes = Array.from(
    new Map(colorVariants.map((v) => [v.size || v.name, v])).values()
  ).filter((v) => !HIDDEN_SIZES.has(v.size))
  const availableSizes = sizes.filter(isAvailable)

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null

  const selectColor = (color: string) => {
    setSelectedColor(color)
    setSelectedVariantId(null)
  }

  return {
    selectedColor,
    hasColors,
    colorVariants,
    sizes,
    availableSizes,
    isAvailable,
    selectedVariantId,
    selectedVariant,
    selectColor,
    selectVariant: setSelectedVariantId,
  }
}
