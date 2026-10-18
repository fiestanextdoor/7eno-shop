import {
  assertUniqueBundleProducts, computeBundlePricing, getBundle, getBundleBySlug, getBundles, getBundlesForProduct,
  type Bundle,
} from './bundles'

// Fixtures: the live list is empty since the OG sets left with the rebrand.
const SETS: Bundle[] = [
  {
    id: 'tee-shorts-set',
    title: 'Tee and Shorts Set',
    discountCents: 500,
    products: [
      { provider: 'printful', productId: '101', slug: 'test-tee' },
      { provider: 'printful', productId: '102', slug: 'test-shorts' },
    ],
  },
  {
    id: 'tee-cap-set',
    title: 'Tee and Cap Set',
    discountCents: 300,
    products: [
      { provider: 'printful', productId: '101', slug: 'test-tee' },
      { provider: 'printful', productId: '201', slug: 'test-cap' },
    ],
  },
]

describe('computeBundlePricing', () => {
  it('subtracts the discount from the summed price', () => {
    expect(computeBundlePricing(5000, 705)).toEqual({ sumCents: 5000, discountCents: 705, setCents: 4295 })
  })
  it('clamps the discount so the set price never goes negative', () => {
    expect(computeBundlePricing(500, 705)).toEqual({ sumCents: 500, discountCents: 500, setCents: 0 })
  })
  it('treats a negative discount as zero', () => {
    expect(computeBundlePricing(5000, -100)).toEqual({ sumCents: 5000, discountCents: 0, setCents: 5000 })
  })
})

describe('live bundles', () => {
  it('has no live sets: every set was OG and OG left the shop', () => {
    expect(getBundles()).toEqual([])
    expect(getBundle('ink-butter-sport-set')).toBeNull()
    expect(getBundlesForProduct({ productId: '433345476' })).toEqual([])
  })
})

describe('bundle lookups', () => {
  it('returns a copy of the list', () => {
    const list = getBundles(SETS)
    expect(list).toEqual(SETS)
    expect(list).not.toBe(SETS)
  })
  it('finds a bundle by id and the same one by slug', () => {
    expect(getBundle('tee-cap-set', SETS)).toBe(SETS[1])
    expect(getBundleBySlug('tee-cap-set', SETS)).toBe(SETS[1])
  })
  it('returns null for an unknown id', () => {
    expect(getBundle('does-not-exist', SETS)).toBeNull()
    expect(getBundleBySlug('does-not-exist', SETS)).toBeNull()
  })
})

describe('getBundlesForProduct', () => {
  it('finds every set that contains a product, by id or by slug', () => {
    expect(getBundlesForProduct({ productId: '101' }, SETS)).toEqual(SETS)
    expect(getBundlesForProduct({ slug: 'test-cap' }, SETS)).toEqual([SETS[1]])
  })
  it('returns an empty array when no set contains the product', () => {
    expect(getBundlesForProduct({ slug: 'definitely-not-a-product' }, SETS)).toEqual([])
    expect(getBundlesForProduct({}, SETS)).toEqual([])
  })
})

describe('assertUniqueBundleProducts', () => {
  it('rejects a set that lists the same product twice', () => {
    const broken: Bundle = { ...SETS[0], products: [SETS[0].products[0], SETS[0].products[0]] }
    expect(() => assertUniqueBundleProducts([broken])).toThrow('Bundle "tee-shorts-set" contains duplicate productIds')
    expect(() => assertUniqueBundleProducts(SETS)).not.toThrow()
  })
})
