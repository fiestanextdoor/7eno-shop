import { renderHook } from '@testing-library/react'
import { computeCartTotals, useCartTotals, type AppliedPromo } from './useCartTotals'
import { useCartStore } from '@/store/cart'
import type { Bundle } from '@/lib/bundles'
import type { CartItem } from '@/types/cart'

function item(price: string, quantity = 1, extra: Partial<CartItem> = {}): CartItem {
  return {
    provider: 'printful', variantId: `v-${price}-${quantity}`, productId: `p-${price}`,
    productName: 'Olympian Tee', variantName: 'M', price, currency: 'EUR', quantity,
    imageUrl: null, ...extra,
  }
}

const SET: Bundle = {
  id: 'set', title: 'Test Set', discountCents: 500,
  products: [
    { provider: 'printful', productId: 'tee', slug: 'tee' },
    { provider: 'printful', productId: 'shorts', slug: 'shorts' },
  ],
}
const fixtureBundle = (id: string) => (id === 'set' ? SET : null)

describe('computeCartTotals', () => {
  it('charges the flat rate below the threshold and says how much is missing', () => {
    const t = computeCartTotals([item('29.95', 2)])
    expect(t.subtotal).toBeCloseTo(59.9)
    expect(t.subtotalCents).toBe(5990)
    expect(t.shippingCost).toBe(4.95)
    expect(t.freeShipping).toBe(false)
    expect(t.remainingForFree).toBeCloseTo(15.1)
    expect(t.grandTotal).toBeCloseTo(64.85)
  })

  it.each<{ label: string; items: CartItem[]; shipping: number }>([
    { label: 'exactly 75.00', items: [item('75.00')], shipping: 0 },
    { label: '74.99', items: [item('74.99')], shipping: 4.95 },
    { label: '3 x 24.95 = 74.85 (float sum)', items: [item('24.95', 3)], shipping: 4.95 },
    { label: '3 x 25.00', items: [item('25.00', 3)], shipping: 0 },
  ])('matches the server shipping rule at $label', ({ items, shipping }) => {
    expect(computeCartTotals(items).shippingCost).toBe(shipping)
  })

  it('applies a percentage promo to the product subtotal only', () => {
    const promo: AppliedPromo = { code: 'MAARDANWEL', percentOff: 7, freeShipping: false }
    const t = computeCartTotals([item('50.00')], promo)
    expect(t.promoDiscount).toBeCloseTo(3.5)
    expect(t.shippingCost).toBe(4.95)
    expect(t.grandTotal).toBeCloseTo(51.45)
  })

  it('waives shipping below the threshold for a free-shipping promo', () => {
    const promo: AppliedPromo = { code: '7ENO-ZGSEA', percentOff: 15, freeShipping: true }
    const t = computeCartTotals([item('20.00')], promo)
    expect(t.shippingCost).toBe(0)
    expect(t.freeShipping).toBe(true)
    expect(t.grandTotal).toBeCloseTo(17)
  })

  it('gives the combi-deal discount only for a complete set', () => {
    const tee = item('30.00', 1, { productId: 'tee', bundleId: 'set' })
    const shorts = item('25.00', 1, { productId: 'shorts', bundleId: 'set' })
    const complete = computeCartTotals([tee, shorts], null, fixtureBundle)
    expect(complete.bundleDiscountCents).toBe(500)
    expect(complete.discountedTotal).toBeCloseTo(50)
    const incomplete = computeCartTotals([tee], null, fixtureBundle)
    expect(incomplete.bundleDiscountCents).toBe(0)
    expect(incomplete.discountedTotal).toBeCloseTo(30)
  })

  it('keeps the checkout grand total without the combi-deal (existing behaviour)', () => {
    const tee = item('30.00', 1, { productId: 'tee', bundleId: 'set' })
    const shorts = item('25.00', 1, { productId: 'shorts', bundleId: 'set' })
    expect(computeCartTotals([tee, shorts], null, fixtureBundle).grandTotal).toBeCloseTo(59.95)
  })

  it('treats an unparsable price as zero and an empty cart as flat-rate shipping', () => {
    expect(computeCartTotals([item('abc', 2)]).subtotal).toBe(0)
    const empty = computeCartTotals([])
    expect(empty.subtotal).toBe(0)
    expect(empty.shippingCost).toBe(4.95)
    expect(empty.grandTotal).toBeCloseTo(4.95)
  })
})

describe('useCartTotals', () => {
  beforeEach(() => useCartStore.setState({ items: [], isCartOpen: false }))

  it('reads the items from the cart store', () => {
    useCartStore.setState({ items: [item('40.00', 2)] })
    const { result } = renderHook(() => useCartTotals())
    expect(result.current.subtotal).toBeCloseTo(80)
    expect(result.current.shippingCost).toBe(0)
  })
})
