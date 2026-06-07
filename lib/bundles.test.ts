import { computeBundlePricing, getBundle, getBundleBySlug, getBundles, getBundlesForProduct } from './bundles'

describe('computeBundlePricing', () => {
  it('subtracts the discount from the summed price', () => {
    expect(computeBundlePricing(5000, 705)).toEqual({
      sumCents: 5000,
      discountCents: 705,
      setCents: 4295,
    })
  })
  it('clamps the discount so the set price never goes negative', () => {
    expect(computeBundlePricing(500, 705)).toEqual({
      sumCents: 500,
      discountCents: 500,
      setCents: 0,
    })
  })
  it('treats a negative discount as zero', () => {
    expect(computeBundlePricing(5000, -100)).toEqual({
      sumCents: 5000,
      discountCents: 0,
      setCents: 5000,
    })
  })
})

describe('bundle lookups', () => {
  it('returns the same list from getBundles', () => {
    expect(Array.isArray(getBundles())).toBe(true)
  })
  it('finds a bundle by id and the same one by slug', () => {
    const first = getBundles()[0]
    expect(getBundle(first.id)).toEqual(first)
    expect(getBundleBySlug(first.id)).toEqual(first)
  })
  it('returns null for an unknown id', () => {
    expect(getBundle('does-not-exist')).toBeNull()
    expect(getBundleBySlug('does-not-exist')).toBeNull()
  })
})

describe('getBundlesForProduct', () => {
  it('finds a bundle that contains a product by slug', () => {
    const bundle = getBundles()[0]
    const slug = bundle.products[0].slug
    expect(getBundlesForProduct({ slug })).toContainEqual(bundle)
  })
  it('finds a bundle that contains a product by productId', () => {
    const bundle = getBundles()[0]
    const productId = bundle.products[0].productId
    expect(getBundlesForProduct({ productId })).toContainEqual(bundle)
  })
  it('returns an empty array when no bundle contains the product', () => {
    expect(getBundlesForProduct({ slug: 'definitely-not-a-product' })).toEqual([])
    expect(getBundlesForProduct({})).toEqual([])
  })
})
