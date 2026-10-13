import type { NormalizedProduct } from '@/types/catalog'
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
