import type { NormalizedProduct } from '@/types/catalog'

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
