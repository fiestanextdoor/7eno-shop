/** @jest-environment node */
import type { ShopProduct } from './catalog'
import { getCatalogProduct } from './catalog'
import { DROPS } from './drops'
import * as printful from './printful'
import { loadProductMedia } from './product-page'
import { removeBackground } from './remove-bg'
import type { NormalizedVariant } from '@/types/catalog'
import type { PrintfulProductDetail } from '@/types/printful'

jest.mock('./catalog', () => ({ getCatalogProduct: jest.fn() }))
jest.mock('./printful', () => ({
  getProduct: jest.fn(),
  getEuSizeMapForProduct: jest.fn(),
  getCatalogProductId: jest.fn(),
  getProductMaterials: jest.fn(),
  getSizeGuide: jest.fn(),
}))
jest.mock('./printful-normalize', () => ({
  variantFrontImage: (v: { front?: string }) => v.front ?? null,
  variantBackImage: (v: { back?: string }) => v.back ?? null,
  variantMockupImages: (v: { mocks?: string[] }) => v.mocks ?? [],
}))
jest.mock('./remove-bg', () => ({ removeBackground: jest.fn() }))

const [, sport] = DROPS
const FRONT = 'https://cdn.test/front-mocha.png'
const BACK = 'https://cdn.test/back-mocha.png'
const MODEL = 'https://cdn.test/model-mocha.jpg'

function variant(id: string, size: string, imageUrl: string | null = FRONT): NormalizedVariant {
  return {
    provider: 'printful', productId: '101', id, name: `Hoodie / ${size}`, size, color: 'Mocha',
    colorCode: '#9E7551', priceCents: 6495, currency: 'EUR', inStock: true, imageUrl,
  }
}

function shopProduct(overrides: Partial<ShopProduct> = {}): ShopProduct {
  return {
    provider: 'printful', id: '101', name: 'OLYMPN Sport Oversized Hoodie Mocha',
    slug: 'olympn-sport-oversized-hoodie-mocha', thumbnailUrl: 'https://cdn.test/thumb.png',
    variants: [variant('1', 'S'), variant('2', 'M')], colors: [], currency: 'EUR',
    drop: sport, status: 'live', purchasable: true, soldOut: false, ...overrides,
  }
}

const SYNC = [
  { variant_id: 9001, size: 'S', color: 'Mocha', front: FRONT, back: BACK, mocks: [FRONT, MODEL, BACK] },
  { variant_id: 9002, size: 'M', color: 'Mocha', front: FRONT, back: BACK, mocks: [FRONT, MODEL, BACK] },
  { variant_id: 9003, size: '4XL', color: 'Mocha', front: FRONT, back: BACK, mocks: [] },
]

beforeEach(() => {
  jest.mocked(removeBackground).mockReset().mockImplementation(async (url: string) => (url.includes('fail') ? null : `${url}#cut`))
  jest.mocked(getCatalogProduct).mockReset()
  jest.mocked(printful.getProduct).mockReset().mockResolvedValue({
    sync_product: { id: 101, name: 'OLYMPN Sport Oversized Hoodie Mocha', thumbnail_url: null, variants: 3, synced: 3 },
    sync_variants: SYNC,
  } as unknown as PrintfulProductDetail)
  jest.mocked(printful.getEuSizeMapForProduct).mockReset().mockResolvedValue({})
  jest.mocked(printful.getCatalogProductId).mockReset().mockResolvedValue(77)
  jest.mocked(printful.getProductMaterials).mockReset().mockResolvedValue(['100% cotton'])
  jest.mocked(printful.getSizeGuide).mockReset().mockResolvedValue({ unit: 'cm', sizes: ['S', 'M'], rows: [] })
})

describe('loadProductMedia', () => {
  it('leads with the cut-out front and back, then the other mockups as-is', async () => {
    const media = await loadProductMedia(shopProduct())
    expect(media.galleries.Mocha.map((i) => i.src)).toEqual([`${FRONT}#cut`, `${BACK}#cut`, MODEL])
    expect(jest.mocked(removeBackground).mock.calls.map(([url]) => url)).not.toContain(MODEL)
    expect(printful.getSizeGuide).toHaveBeenCalledWith(77, ['S', 'M'])
    expect(media.materials).toEqual(['100% cotton'])
    expect(media.sizeGuide).toEqual({ unit: 'cm', sizes: ['S', 'M'], rows: [] })
    expect(media.variants).toHaveLength(2)
  })

  it('falls back to the original image when remove.bg fails', async () => {
    const failing = 'https://cdn.test/fail-front.png'
    const media = await loadProductMedia(shopProduct({ variants: [variant('1', 'S', failing)] }))
    expect(media.galleries.Mocha[0].src).toBe(failing)
  })

  it('lets local overrides win, without sending them to remove.bg', async () => {
    const media = await loadProductMedia(shopProduct({ slug: 'butter-blood-tee-men' }))
    expect(media.galleries.Mocha.slice(0, 2).map((i) => i.src)).toEqual([
      '/products/butter-blood-tee-men/front.png',
      '/products/butter-blood-tee-men/back.png',
    ])
    expect(jest.mocked(removeBackground).mock.calls.map(([url]) => url)).not.toContain('/products/butter-blood-tee-men/front.png')
  })

  it('still renders without the Printful extras when Printful fails', async () => {
    jest.mocked(printful.getProduct).mockRejectedValue(new Error('printful down'))
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const media = await loadProductMedia(shopProduct())
    expect(media.sizeGuide).toBeNull()
    expect(media.materials).toEqual([])
    expect(media.galleries.Mocha.map((i) => i.src)).toEqual([`${FRONT}#cut`])
    errorSpy.mockRestore()
  })

  it('fetches the variants once more when the catalogue had none, and survives a failure', async () => {
    jest.mocked(getCatalogProduct).mockRejectedValue(new Error('detail down'))
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const media = await loadProductMedia(shopProduct({ variants: [] }))
    expect(getCatalogProduct).toHaveBeenCalledWith('printful', '101')
    expect(media.variants).toEqual([])
    expect(media.galleries).toEqual({
      '': [{ src: 'https://cdn.test/thumb.png#cut', alt: 'OLYMPN Sport Oversized Hoodie Mocha, front' }],
    })
    errorSpy.mockRestore()
  })
})
