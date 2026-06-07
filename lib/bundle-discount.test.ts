import { resolveBundleDiscountCents } from './bundle-discount'
import type { Bundle } from './bundles'

const BEACH: Bundle = {
  id: 'beach-set',
  title: 'Beach Set',
  discountCents: 705,
  products: [
    { provider: 'printful', productId: 'A', slug: 'a' },
    { provider: 'printful', productId: 'B', slug: 'b' },
  ],
}
const getBundle = (id: string) => (id === 'beach-set' ? BEACH : null)

describe('resolveBundleDiscountCents', () => {
  it('applies the discount when a complete set is present', () => {
    const items = [
      { bundleId: 'beach-set', productId: 'A', resolved: true },
      { bundleId: 'beach-set', productId: 'B', resolved: true },
    ]
    expect(resolveBundleDiscountCents(items, 5000, getBundle)).toBe(705)
  })

  it('gives no discount when the set is incomplete', () => {
    const items = [{ bundleId: 'beach-set', productId: 'A', resolved: true }]
    expect(resolveBundleDiscountCents(items, 5000, getBundle)).toBe(0)
  })

  it('gives no discount when the group has an extra product', () => {
    const items = [
      { bundleId: 'beach-set', productId: 'A', resolved: true },
      { bundleId: 'beach-set', productId: 'B', resolved: true },
      { bundleId: 'beach-set', productId: 'C', resolved: true },
    ]
    expect(resolveBundleDiscountCents(items, 5000, getBundle)).toBe(0)
  })

  it('gives no discount when a member variant did not resolve', () => {
    const items = [
      { bundleId: 'beach-set', productId: 'A', resolved: true },
      { bundleId: 'beach-set', productId: 'B', resolved: false },
    ]
    expect(resolveBundleDiscountCents(items, 5000, getBundle)).toBe(0)
  })

  it('ignores unknown bundle ids', () => {
    const items = [
      { bundleId: 'ghost', productId: 'A', resolved: true },
      { bundleId: 'ghost', productId: 'B', resolved: true },
    ]
    expect(resolveBundleDiscountCents(items, 5000, getBundle)).toBe(0)
  })

  it('clamps the total discount to the subtotal', () => {
    const items = [
      { bundleId: 'beach-set', productId: 'A', resolved: true },
      { bundleId: 'beach-set', productId: 'B', resolved: true },
    ]
    expect(resolveBundleDiscountCents(items, 300, getBundle)).toBe(300)
  })

  it('never returns a negative discount when the subtotal is negative', () => {
    const items = [
      { bundleId: 'beach-set', productId: 'A', resolved: true },
      { bundleId: 'beach-set', productId: 'B', resolved: true },
    ]
    expect(resolveBundleDiscountCents(items, -1, getBundle)).toBe(0)
  })

  it('gives no discount when the same product is sent twice for one set', () => {
    const items = [
      { bundleId: 'beach-set', productId: 'A', resolved: true },
      { bundleId: 'beach-set', productId: 'A', resolved: true },
    ]
    expect(resolveBundleDiscountCents(items, 5000, getBundle)).toBe(0)
  })
})
