import { useMemo } from 'react'
import { useCartStore } from '@/store/cart'
import { getBundle as liveGetBundle, type Bundle } from '@/lib/bundles'
import { resolveBundleDiscountCents } from '@/lib/bundle-discount'
import { computeShippingCents, FREE_SHIPPING_THRESHOLD } from '@/lib/shipping'
import type { CartItem } from '@/types/cart'

/** A discount code the server accepted (see /api/promo/validate). */
export interface AppliedPromo {
  code: string
  percentOff: number
  freeShipping: boolean
}

/**
 * Display totals for the cart drawer and the checkout. Amounts in euro unless
 * the name says cents. Display only: /api/checkout recomputes everything from
 * server-trusted prices.
 */
export interface CartTotals {
  subtotal: number
  subtotalCents: number
  bundleDiscountCents: number
  discountedTotal: number
  shippingCost: number
  freeShipping: boolean
  remainingForFree: number
  promoDiscount: number
  grandTotal: number
}

export function computeCartTotals(
  items: CartItem[],
  promo: AppliedPromo | null = null,
  getBundle: (id: string) => Bundle | null = liveGetBundle,
): CartTotals {
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * item.quantity, 0)
  const subtotalCents = Math.round(subtotal * 100)

  const bundleDiscountCents = resolveBundleDiscountCents(
    items.filter((i) => i.bundleId).map((i) => ({ bundleId: i.bundleId!, productId: i.productId, resolved: true })),
    subtotalCents,
    getBundle,
  )

  // Same rule as the server: flat fee, free from the threshold, waived by a
  // free-shipping code.
  const shippingCost = promo?.freeShipping ? 0 : computeShippingCents(subtotalCents) / 100
  // The discount code applies to the product subtotal, never to shipping.
  const promoDiscount = promo ? (subtotal * promo.percentOff) / 100 : 0

  return {
    subtotal,
    subtotalCents,
    bundleDiscountCents,
    discountedTotal: (subtotalCents - bundleDiscountCents) / 100,
    shippingCost,
    freeShipping: shippingCost === 0,
    remainingForFree: Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal),
    promoDiscount,
    grandTotal: Math.max(0, subtotal + shippingCost - promoDiscount),
  }
}

/** Totals for the current cart in the store. */
export function useCartTotals(promo: AppliedPromo | null = null): CartTotals {
  const items = useCartStore((s) => s.items)
  return useMemo(() => computeCartTotals(items, promo), [items, promo])
}
