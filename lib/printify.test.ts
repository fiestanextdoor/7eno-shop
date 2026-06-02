import {
  mapPrintifyProduct,
  splitName,
  buildPrintifyOrderItems,
  type PrintifyProduct,
} from './printify'

const raw: PrintifyProduct = {
  id: 'abc123',
  title: 'Olympus Tee',
  description: 'desc',
  tags: [],
  visible: true,
  blueprint_id: 5,
  print_provider_id: 9,
  options: [
    { name: 'Colors', type: 'color', values: [
      { id: 1, title: 'Black', colors: ['#111111'] },
      { id: 2, title: 'White', colors: ['#FFFFFF'] },
    ] },
    { name: 'Sizes', type: 'size', values: [
      { id: 10, title: 'M' },
      { id: 11, title: 'L' },
    ] },
  ],
  variants: [
    { id: 100, sku: 'S1', price: 2995, cost: 1200, title: 'Black / M', is_enabled: true, is_default: true, is_available: true, options: [1, 10] },
    { id: 101, sku: 'S2', price: 2995, cost: 1200, title: 'Black / L', is_enabled: true, is_default: false, is_available: true, options: [1, 11] },
    { id: 102, sku: 'S3', price: 2995, cost: 1200, title: 'White / M', is_enabled: false, is_default: false, is_available: true, options: [2, 10] },
  ],
  images: [
    { src: 'https://img/black.png', variant_ids: [100, 101], position: 'front', is_default: true },
    { src: 'https://img/white.png', variant_ids: [102], position: 'front', is_default: false },
  ],
}

describe('mapPrintifyProduct', () => {
  const product = mapPrintifyProduct(raw)

  it('carries provider and stringified ids', () => {
    expect(product.provider).toBe('printify')
    expect(product.id).toBe('abc123')
    expect(product.variants[0].id).toBe('100')
    expect(product.variants[0].productId).toBe('abc123')
  })

  it('resolves color and size from option ids', () => {
    expect(product.variants[0].color).toBe('Black')
    expect(product.variants[0].size).toBe('M')
    expect(product.variants[0].colorCode).toBe('#111111')
  })

  it('keeps price in cents and applies the shop currency', () => {
    expect(product.variants[0].priceCents).toBe(2995)
    expect(product.variants[0].currency).toBe('EUR')
  })

  it('drops disabled variants', () => {
    expect(product.variants.map((v) => v.id)).toEqual(['100', '101'])
  })

  it('selects the per-variant image via variant_ids', () => {
    expect(product.variants[0].imageUrl).toBe('https://img/black.png')
  })

  it('builds a deduped color list from enabled variants', () => {
    expect(product.colors.map((c) => c.color)).toEqual(['Black'])
    expect(product.colors[0].hex).toBe('#111111')
  })

  it('exposes a default price for cards', () => {
    expect(product.priceCents).toBe(2995)
  })
})

describe('splitName', () => {
  it('splits a full name into first and last', () => {
    expect(splitName('Jan Jansen')).toEqual({ first_name: 'Jan', last_name: 'Jansen' })
  })
  it('puts a single token in first_name and a placeholder last_name', () => {
    expect(splitName('Jan')).toEqual({ first_name: 'Jan', last_name: '-' })
  })
  it('keeps multi-word surnames intact', () => {
    expect(splitName('Jan van der Berg')).toEqual({ first_name: 'Jan', last_name: 'van der Berg' })
  })
})

describe('buildPrintifyOrderItems', () => {
  it('maps cart lines to Printify line items with numeric ids', () => {
    const items = buildPrintifyOrderItems([
      { productId: 'abc123', variantId: '100', quantity: 2 },
    ])
    expect(items).toEqual([{ product_id: 'abc123', variant_id: 100, quantity: 2 }])
  })
})
