import type { NormalizedProduct } from '@/types/catalog'
import type { PrintfulProductDetail } from '@/types/printful'
import * as printful from '@/lib/printful'
import * as printify from '@/lib/printify'

// Relative paths: SWC rewrites '@/' in imports, not in jest.mock strings.
jest.mock('./printful', () => ({ getProducts: jest.fn(), getProduct: jest.fn() }))
jest.mock('./printify', () => ({ getProducts: jest.fn(), getProduct: jest.fn() }))

const pf: NormalizedProduct = { provider: 'printful', id: '1', name: 'Zeus Hoodie', thumbnailUrl: null, variants: [], colors: [], currency: 'EUR' }
const pi: NormalizedProduct = { provider: 'printify', id: 'abc', name: 'Olympus Tee', thumbnailUrl: null, variants: [], colors: [], currency: 'EUR' }

describe('mergeCatalogs', () => {
  it('concatenates products from both providers', async () => {
    const { mergeCatalogs } = await import('./catalog')
    const merged = mergeCatalogs(
      { status: 'fulfilled', value: [pf] },
      { status: 'fulfilled', value: [pi] }
    )
    expect(merged.map((p) => p.id)).toEqual(['1', 'abc'])
  })

  it('returns the surviving provider when the other rejects (never empty-on-partial-failure)', async () => {
    const { mergeCatalogs } = await import('./catalog')
    const merged = mergeCatalogs(
      { status: 'fulfilled', value: [pf] },
      { status: 'rejected', reason: new Error('printify down') }
    )
    expect(merged.map((p) => p.id)).toEqual(['1'])
  })
})

describe('findBySlug', () => {
  it('matches a product by its name-based slug', async () => {
    const { findBySlug } = await import('./catalog')
    expect(findBySlug([pf, pi], 'olympus-tee')?.id).toBe('abc')
  })
  it('returns null when nothing matches', async () => {
    const { findBySlug } = await import('./catalog')
    expect(findBySlug([pf, pi], 'nope')).toBeNull()
  })
})

describe('isInStock', () => {
  const variant = (inStock: boolean) => ({
    provider: 'printful' as const, productId: '1', id: 'v', name: 'M', size: 'M',
    color: '', colorCode: '', priceCents: 1000, currency: 'EUR', inStock, imageUrl: null,
  })
  it('treats a product with no loaded variants as in stock (never hides on missing data)', async () => {
    const { isInStock } = await import('./catalog')
    expect(isInStock(pf)).toBe(true)
  })
  it('is in stock when at least one variant is available', async () => {
    const { isInStock } = await import('./catalog')
    expect(isInStock({ ...pf, variants: [variant(false), variant(true)] })).toBe(true)
  })
  it('is out of stock when every variant is unavailable', async () => {
    const { isInStock } = await import('./catalog')
    expect(isInStock({ ...pf, variants: [variant(false), variant(false)] })).toBe(false)
  })
})

describe('getCatalogProducts', () => {
  const syncProduct = (id: number, name: string) => ({ id, name, thumbnail_url: null, variants: 5, synced: 5 })

  beforeEach(() => {
    jest.mocked(printful.getProducts).mockReset()
    jest.mocked(printify.getProducts).mockReset()
  })

  it('hides unreleased OLYMPN Sport products from both providers', async () => {
    jest.mocked(printful.getProducts).mockResolvedValue([
      syncProduct(1, 'Olympian Hoodie Teal'),
      syncProduct(2, 'OLYMPN Sport Oversized Hoodie Rose Red'),
    ])
    jest.mocked(printify.getProducts).mockResolvedValue([
      { ...pi, id: 'x', name: 'olympn sport tee' },
      pi,
    ])
    const { getCatalogProducts } = await import('./catalog')
    const names = (await getCatalogProducts()).map((p) => p.name)
    expect(names).toEqual(['Olympian Hoodie Teal', 'Olympus Tee'])
  })

  it('keeps OG sport products whose name only contains "Sport"', async () => {
    jest.mocked(printful.getProducts).mockResolvedValue([
      syncProduct(433345476, 'Ink/Butter Sport Tee Unisex'),
      syncProduct(433351405, 'Ink/Butter Sport Shorts Unisex'),
    ])
    jest.mocked(printify.getProducts).mockResolvedValue([])
    const { getCatalogProducts } = await import('./catalog')
    expect((await getCatalogProducts()).map((p) => p.id)).toEqual(['433345476', '433351405'])
  })

  it('still returns the surviving provider when the other one fails', async () => {
    jest.mocked(printful.getProducts).mockRejectedValue(new Error('printful down'))
    jest.mocked(printify.getProducts).mockResolvedValue([pi, { ...pi, id: 'y', name: 'OLYMPN Sport Cap' }])
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const { getCatalogProducts } = await import('./catalog')
    expect((await getCatalogProducts()).map((p) => p.id)).toEqual(['abc'])
    errorSpy.mockRestore()
  })
})

describe('getShopProducts', () => {
  const BEFORE_SPORT = Date.parse('2026-10-14T10:00:00Z')
  const SPORT_RELEASE = Date.parse('2026-11-01T11:00:00Z')

  const listing = (id: number, name: string) => ({
    id, name, thumbnail_url: `https://files.cdn.printful.com/${id}.png`, variants: 2, synced: 2,
  })
  const detail = (id: number, name: string, stock: boolean[] = [true, true]): PrintfulProductDetail => ({
    sync_product: listing(id, name),
    sync_variants: stock.map((inStock, i) => ({
      id: id * 10 + i, sync_product_id: id, variant_id: 4000 + i, name: `${name} / ${['M', 'L', 'XL'][i]}`,
      retail_price: '45.00', currency: 'EUR', is_ignored: false, sku: `${id}-${i}`, files: [],
      size: ['M', 'L', 'XL'][i], color: 'White', color_code: '#ffffff', color_code2: null, in_stock: inStock,
    })),
  })

  // Provider order on purpose: OG first, Olympian and OLYMPN Sport mixed.
  const CATALOGUE: [number, string][] = [
    [1, 'Ink/Butter Sport Tee Unisex'],
    [2, 'Olympian Tee Sand Unisex'],
    [3, 'Olympian Knitted Tee Ocean Unisex'],
    [4, 'OLYMPN Sport Oversized Hoodie Mocha'],
    [5, 'OLYMPN Sport Relaxed Hoodie Dune'],
    [6, 'Olympian Tee Ocean Unisex'],
  ]
  let details: Map<string, PrintfulProductDetail>

  beforeEach(() => {
    details = new Map(CATALOGUE.map(([id, name]) => [String(id), detail(id, name)]))
    jest.mocked(printful.getProducts).mockReset().mockResolvedValue(CATALOGUE.map(([id, name]) => listing(id, name)))
    jest.mocked(printful.getProduct).mockReset().mockImplementation(async (id: string) => {
      const d = details.get(id)
      if (!d) throw new Error(`no detail for ${id}`)
      return d
    })
    jest.mocked(printify.getProducts).mockReset()
  })

  it('keeps only drop products, sorted by edition, family and colour', async () => {
    const { getShopProducts } = await import('./catalog')
    const names = (await getShopProducts(BEFORE_SPORT)).map((p) => p.name)
    expect(names).toEqual([
      'OLYMPN Sport Oversized Hoodie Mocha',
      'OLYMPN Sport Relaxed Hoodie Dune',
      'Olympian Knitted Tee Ocean Unisex',
      'Olympian Tee Ocean Unisex',
      'Olympian Tee Sand Unisex',
    ])
  })

  it('never fetches Printify', async () => {
    const { getShopProducts } = await import('./catalog')
    await getShopProducts(BEFORE_SPORT)
    expect(printify.getProducts).not.toHaveBeenCalled()
  })

  it('shows teaser products before the release, but not for sale', async () => {
    const { getShopProducts } = await import('./catalog')
    const products = await getShopProducts(BEFORE_SPORT)
    const sport = products.filter((p) => p.drop.id === 'olympn-sport')
    expect(sport).toHaveLength(2)
    expect(sport.every((p) => p.status === 'upcoming' && !p.purchasable)).toBe(true)
    expect(products.filter((p) => p.drop.id === 'olympian').every((p) => p.purchasable)).toBe(true)
  })

  it('sells teaser products from the release millisecond', async () => {
    const { getShopProducts } = await import('./catalog')
    const sport = (await getShopProducts(SPORT_RELEASE)).filter((p) => p.drop.id === 'olympn-sport')
    expect(sport.every((p) => p.status === 'live' && p.purchasable)).toBe(true)
  })

  it('sells an upcoming drop in preview', async () => {
    const { getShopProducts } = await import('./catalog')
    const sport = (await getShopProducts(BEFORE_SPORT, { preview: true })).filter((p) => p.drop.id === 'olympn-sport')
    expect(sport.every((p) => p.purchasable)).toBe(true)
  })

  it('marks a product with every variant out of stock as sold out instead of hiding it', async () => {
    details.set('2', detail(2, 'Olympian Tee Sand Unisex', [false, false]))
    const { getShopProducts } = await import('./catalog')
    const sand = (await getShopProducts(BEFORE_SPORT)).find((p) => p.id === '2')
    expect(sand?.soldOut).toBe(true)
    expect(sand?.slug).toBe('olympian-tee-sand-unisex')
  })

  it('loads variants and price from the product detail', async () => {
    const { getShopProducts } = await import('./catalog')
    const ocean = (await getShopProducts(BEFORE_SPORT)).find((p) => p.id === '6')
    expect(ocean?.variants).toHaveLength(2)
    expect(ocean?.priceCents).toBe(4500)
    expect(ocean?.soldOut).toBe(false)
  })

  it('keeps a product whose detail fails, without claiming it is sold out', async () => {
    details.delete('3')
    const { getShopProducts } = await import('./catalog')
    const knit = (await getShopProducts(BEFORE_SPORT)).find((p) => p.id === '3')
    expect(knit?.variants).toEqual([])
    expect(knit?.soldOut).toBe(false)
  })

  it('returns an empty shop when Printful is down', async () => {
    jest.mocked(printful.getProducts).mockRejectedValue(new Error('printful down'))
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const { getShopProducts } = await import('./catalog')
    await expect(getShopProducts(BEFORE_SPORT)).resolves.toEqual([])
    errorSpy.mockRestore()
  })
})

describe('isRetiredProductSlug', () => {
  beforeEach(() => {
    jest.mocked(printful.getProducts).mockReset().mockResolvedValue([
      { id: 433345476, name: 'Ink/Butter Sport Tee Unisex', thumbnail_url: null, variants: 5, synced: 5 },
    ])
    jest.mocked(printify.getProducts).mockReset().mockResolvedValue([pi])
  })

  it('recognises an OG or Printify product that left the shop', async () => {
    const { isRetiredProductSlug } = await import('./catalog')
    await expect(isRetiredProductSlug('ink-butter-sport-tee-unisex')).resolves.toBe(true)
    await expect(isRetiredProductSlug('olympus-tee')).resolves.toBe(true)
  })

  it('is false for a slug that never existed', async () => {
    const { isRetiredProductSlug } = await import('./catalog')
    await expect(isRetiredProductSlug('no-such-product')).resolves.toBe(false)
  })
})
