import { normalizePrintfulProduct, normalizePrintfulDetail } from './printful-normalize'
import type { SyncProduct, PrintfulProductDetail } from '@/types/printful'

const listItem: SyncProduct = {
  id: 555,
  name: 'Zeus Hoodie',
  thumbnail_url: 'https://img/zeus.png',
  variants: 4,
  synced: 4,
}

describe('normalizePrintfulProduct', () => {
  const p = normalizePrintfulProduct(listItem)
  it('tags provider and stringifies the id', () => {
    expect(p.provider).toBe('printful')
    expect(p.id).toBe('555')
    expect(p.name).toBe('Zeus Hoodie')
    expect(p.thumbnailUrl).toBe('https://img/zeus.png')
  })
})

const detail: PrintfulProductDetail = {
  sync_product: listItem,
  sync_variants: [
    {
      id: 9001, sync_product_id: 555, variant_id: 700, name: 'Zeus Hoodie - Black / M',
      retail_price: '49.99', currency: 'EUR', is_ignored: false, sku: 'Z-BM',
      files: [{ type: 'preview', id: 1, url: 'u', options: [], hash: '', filename: '', mime_type: '', size: 0, width: 0, height: 0, dpi: 0, status: '', created: 0, thumbnail_url: null, preview_url: 'https://img/zeus-black.png', visible: true }],
      size: 'M', color: 'Black', color_code: '#111111', color_code2: null, in_stock: true,
    },
  ],
}

describe('normalizePrintfulDetail', () => {
  const p = normalizePrintfulDetail(detail)
  it('maps variants with cents price and stringified ids', () => {
    expect(p.variants[0].id).toBe('9001')
    expect(p.variants[0].productId).toBe('555')
    expect(p.variants[0].priceCents).toBe(4999)
    expect(p.variants[0].currency).toBe('EUR')
    expect(p.variants[0].size).toBe('M')
    expect(p.variants[0].color).toBe('Black')
  })
  it('exposes a default price for cards', () => {
    expect(p.priceCents).toBe(4999)
  })
})
