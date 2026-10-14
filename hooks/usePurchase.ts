import { useEffect, useState } from 'react'
import type { SizeOption } from '@/components/ui/SizeSelector/SizeSelector'
import { useVariantPicker } from '@/hooks/useVariantPicker'
import { formatPrice } from '@/lib/money'
import { useCartStore } from '@/store/cart'
import type { NormalizedVariant, Provider } from '@/types/catalog'

/** How long the button says "Added to cart" (same as the old product page). */
export const ADDED_MS = 2200

export interface UsePurchaseOptions {
  provider: Provider
  productId: string
  productName: string
  variants: NormalizedVariant[]
  /** Every variant out of stock (ShopProduct.soldOut): the whole product is sold out. */
  soldOut: boolean
  /** EU labels for footwear sizes, from Printful. */
  euSizeMap?: Record<string, string>
  /**
   * Cart thumbnail for a colour. Must equal the old ProductDetail `frontFor(colour)`
   * (`frontOverride ?? colorImages[colour] ?? baseImageUrl`), so the cart shows the
   * same thumbnail as before the redesign; ProductView builds it that way.
   */
  imageFor(colour: string): string | null
}

/** Everything the buy panel and the sticky bar show and do. */
export interface Purchase {
  /** Colours within this one product (rare: v2 colours are separate products). */
  colours: SizeOption[]
  selectedColour: string
  selectColour(colour: string): void
  /** One option per size; value is the variant id. */
  sizes: SizeOption[]
  selectedSize: string | null
  selectSize(variantId: string): void
  /** More than one size and none chosen yet. */
  needsSize: boolean
  /** The chosen size (or the whole product) cannot be bought: offer "Notify me". */
  selectionSoldOut: boolean
  /** Price of the chosen size, else the first offered size, else the first variant; null when unknown. */
  price: string | null
  added: boolean
  addToCart(): void
}

export function sizeLabel(v: Pick<NormalizedVariant, 'size' | 'name'>, euSizeMap: Record<string, string> = {}): string {
  return euSizeMap[v.size] ?? (v.size || v.name).replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * The buy state of one product page on top of useVariantPicker and the cart
 * store. Sold out follows spec section 5: struck through, selectable, and
 * "Notify me" instead of adding.
 */
export function usePurchase({
  provider,
  productId,
  productName,
  variants,
  soldOut,
  euSizeMap = {},
  imageFor,
}: UsePurchaseOptions): Purchase {
  const colourKeys = [...new Set(variants.map((v) => v.color).filter(Boolean))]
  const picker = useVariantPicker({ variants, colors: colourKeys })
  const { selectedColor, selectedVariant, selectColor, selectVariant, isAvailable } = picker
  const pickerSizes = picker.sizes
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const isSoldOut = (v: NormalizedVariant) => soldOut || !isAvailable(v)

  // Preselect a colour when arriving via a swatch deep link (/shop/{slug}?color=...).
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('color')
    if (param && colourKeys.includes(param)) selectColor(param)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-select the only variant of a one-size product (bags, caps), unless it
  // is sold out: then the shopper sees "Notify me" without a chosen size.
  useEffect(() => {
    if (pickerSizes.length === 1 && !isSoldOut(pickerSizes[0])) selectVariant(pickerSizes[0].id)
  }, [selectedColor]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!added) return
    const t = setTimeout(() => setAdded(false), ADDED_MS)
    return () => clearTimeout(t)
  }, [added])

  const chosen = selectedVariant ?? (pickerSizes.length === 1 ? pickerSizes[0] : null)
  const selectionSoldOut = soldOut || pickerSizes.length === 0 || (chosen !== null && isSoldOut(chosen))
  // Hidden sizes never supply the price; variants[0] only when no size is offered.
  const priced = chosen ?? pickerSizes[0] ?? variants[0] ?? null

  function addToCart() {
    if (!chosen || selectionSoldOut) return
    addItem({
      provider,
      variantId: chosen.id,
      productId,
      productName,
      variantName: chosen.name,
      price: (chosen.priceCents / 100).toFixed(2),
      currency: chosen.currency,
      quantity: 1,
      imageUrl: imageFor(selectedColor),
    })
    setAdded(true)
  }

  return {
    colours: colourKeys.map((colour) => ({ value: colour, label: colour, soldOut: false })),
    selectedColour: selectedColor,
    selectColour: selectColor,
    sizes: pickerSizes.map((v) => ({ value: v.id, label: sizeLabel(v, euSizeMap), soldOut: isSoldOut(v) })),
    selectedSize: selectedVariant?.id ?? null,
    selectSize: selectVariant,
    needsSize: pickerSizes.length > 1 && selectedVariant === null,
    selectionSoldOut,
    price: priced ? formatPrice(priced.priceCents, priced.currency) : null,
    added,
    addToCart,
  }
}
