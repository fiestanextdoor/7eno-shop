import {
  normalizePrintfulProduct,
  normalizePrintfulDetail,
  variantFrontImage,
  variantBackImage,
  variantMockupImages,
} from './printful-normalize'
import type { SyncProduct, PrintfulProductDetail, SyncVariant, PrintfulFile } from '@/types/printful'

function file(type: string, filename: string, preview_url: string | null): PrintfulFile {
  return {
    type, id: 1, url: 'print-source', options: [], hash: '', filename,
    mime_type: '', size: 0, width: 0, height: 0, dpi: 0, status: 'ok',
    created: 0, thumbnail_url: null, preview_url, visible: false,
  }
}

function variant(files: PrintfulFile[]): SyncVariant {
  return {
    id: 1, sync_product_id: 1, variant_id: 1, name: 'V', retail_price: '10',
    currency: 'EUR', is_ignored: false, sku: '', files, size: 'M', color: 'Black',
    color_code: '#000', color_code2: null, in_stock: true,
  }
}

// URLs mirror Printful's real shapes: `printfile-preview/…` is raw artwork,
// `files/…_preview.png` is a generated product mockup.
const PRINTFILE = 'https://files.cdn.printful.com/printfile-preview/1/x_preview.png'
const FRONT_MOCKUP = 'https://files.cdn.printful.com/files/aaa/front_preview.png'
const BACK_MOCKUP = 'https://files.cdn.printful.com/files/bbb/back_preview.png'

describe('variantFrontImage', () => {
  it('uses the preview mockup when present', () => {
    const v = variant([file('front_dtf', 'art.png', PRINTFILE), file('preview', 'tee-white-front.jpg', FRONT_MOCKUP)])
    expect(variantFrontImage(v)).toBe(FRONT_MOCKUP)
  })

  it('uses a "mockup" type file and never the raw print file (the Men Tee bug)', () => {
    // Order matches the real API: the print file comes first.
    const v = variant([
      file('front_dtf', 'beeldmerk.png', PRINTFILE),
      file('back_dtf', 'wordmark.png', PRINTFILE),
      file('mockup', 'mens-box-tee-vintage-black-front-6a08.jpg', FRONT_MOCKUP),
    ])
    expect(variantFrontImage(v)).toBe(FRONT_MOCKUP)
  })

  it('falls back to a back mockup when it is the only mockup', () => {
    const v = variant([
      file('front_dtf', 'art.png', PRINTFILE),
      file('mockup', 'mens-box-tee-vintage-white-back-6a08.png', BACK_MOCKUP),
    ])
    expect(variantFrontImage(v)).toBe(BACK_MOCKUP)
  })

  it('returns null when there is no mockup, never a print file', () => {
    const v = variant([file('front_dtf', 'art.png', PRINTFILE), file('back', 'art.png', PRINTFILE)])
    expect(variantFrontImage(v)).toBeNull()
  })
})

describe('variantBackImage', () => {
  it('returns a genuine back mockup', () => {
    const v = variant([file('preview', 'tee-front.jpg', FRONT_MOCKUP), file('mockup', 'tee-back.jpg', BACK_MOCKUP)])
    expect(variantBackImage(v)).toBe(BACK_MOCKUP)
  })

  it('does not treat a back_dtf print file as a back view', () => {
    const v = variant([file('preview', 'tee-front.jpg', FRONT_MOCKUP), file('back_dtf', 'wordmark-back.png', PRINTFILE)])
    expect(variantBackImage(v)).toBeNull()
  })

  it('does not mistake "backpack" for a back view', () => {
    const v = variant([file('preview', 'all-over-print-backpack-white-front.jpg', FRONT_MOCKUP)])
    expect(variantBackImage(v)).toBeNull()
  })
})

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

describe('variantMockupImages', () => {
  const FLAT = 'https://files.cdn.printful.com/files/ccc/tee-white-flat_preview.png'
  const MODEL = 'https://files.cdn.printful.com/files/ddd/tee-white-mens-2_preview.png'

  it('returns every mockup, never the raw print file', () => {
    const v = variant([
      file('front_dtf', 'art.png', PRINTFILE),
      file('preview', 'tee-white-front.jpg', FRONT_MOCKUP),
      file('mockup', 'tee-white-flat.jpg', FLAT),
      file('mockup', 'tee-white-mens-2.jpg', MODEL),
    ])
    expect(variantMockupImages(v)).toEqual([FRONT_MOCKUP, FLAT, MODEL])
  })

  it('orders back angles last so the gallery leads with front views', () => {
    const v = variant([
      file('mockup', 'tee-white-back.jpg', BACK_MOCKUP),
      file('mockup', 'tee-white-flat.jpg', FLAT),
    ])
    expect(variantMockupImages(v)).toEqual([FLAT, BACK_MOCKUP])
  })

  it('deduplicates a mockup that repeats across placements', () => {
    const v = variant([
      file('preview', 'tee-white-front.jpg', FRONT_MOCKUP),
      file('mockup', 'tee-white-front-copy.jpg', FRONT_MOCKUP),
    ])
    expect(variantMockupImages(v)).toEqual([FRONT_MOCKUP])
  })

  it('is empty when the variant only carries print artwork', () => {
    expect(variantMockupImages(variant([file('front_dtf', 'art.png', PRINTFILE)]))).toEqual([])
  })
})
