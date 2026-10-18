import { render } from '@testing-library/react'
import { createElement } from 'react'
import type { ShopProduct } from '@/lib/catalog'
import { DROPS, type Drop, type DropStatus } from '@/lib/drops'
import type { ProductMedia } from '@/lib/product-page'
import ProductPage, { generateMetadata } from './page'

const mockGetShopProducts = jest.fn()
const mockIsRetired = jest.fn()
const mockLoadMedia = jest.fn()

interface MockViewProps {
  product: { purchasable: boolean; releaseLabel?: string }
}

function mockView(p: MockViewProps) {
  return createElement('div', {
    'data-testid': 'product-view',
    'data-purchasable': String(p.product.purchasable),
    'data-release': p.product.releaseLabel ?? '',
  })
}

jest.mock('../../../lib/catalog', () => ({
  ...jest.requireActual('../../../lib/catalog'),
  getShopProducts: (...args: unknown[]) => mockGetShopProducts(...args),
  isRetiredProductSlug: (...args: unknown[]) => mockIsRetired(...args),
}))
jest.mock('../../../lib/preview-session', () => ({ isPreviewSession: async () => false }))
jest.mock('../../../lib/product-page', () => ({ loadProductMedia: (...args: unknown[]) => mockLoadMedia(...args) }))
jest.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
  permanentRedirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`)
  },
}))
jest.mock('./ProductView', () => ({ __esModule: true, default: (p: MockViewProps) => mockView(p) }))

const [olympian, sport] = DROPS

function product(name: string, slug: string, drop: Drop, status: DropStatus, id = slug): ShopProduct {
  return {
    provider: 'printful', id, name, slug, thumbnailUrl: null, variants: [], colors: [], currency: 'EUR',
    drop, status, purchasable: status === 'live', soldOut: false,
  }
}

const MEDIA: ProductMedia = {
  variants: [
    {
      provider: 'printful', productId: 'x', id: 'v1', name: 'x / M', size: 'M', color: '', colorCode: '',
      priceCents: 6495, currency: 'EUR', inStock: true, imageUrl: null,
    },
  ],
  currency: 'EUR',
  galleries: { '': [] },
  euSizeMap: {},
  materials: [],
  sizeGuide: null,
  schemaImages: [],
}

const params = (slug: string) => ({ params: Promise.resolve({ slug }) })

function jsonLd(type: string): Record<string, unknown> {
  const blocks = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(
    (s) => JSON.parse(s.textContent ?? '{}') as Record<string, unknown>
  )
  return blocks.find((b) => b['@type'] === type) ?? {}
}

beforeEach(() => {
  mockGetShopProducts.mockReset().mockResolvedValue([
    product('OLYMPN Sport Oversized Hoodie Mocha', 'olympn-sport-oversized-hoodie-mocha', sport, 'upcoming'),
    product('Olympian Tee Sand Unisex', 'olympian-tee-sand-unisex', olympian, 'live', '433351254'),
  ])
  mockIsRetired.mockReset().mockResolvedValue(false)
  mockLoadMedia.mockReset().mockResolvedValue(MEDIA)
})

describe('product page metadata', () => {
  it('keeps a teaser product page out of the index and names its drop', async () => {
    const meta = await generateMetadata(params('olympn-sport-oversized-hoodie-mocha'))
    expect(meta.robots).toEqual({ index: false, follow: true, googleBot: { index: false, follow: true } })
    expect(meta.description).toContain('OLYMPN Sport collection')
  })

  it('leaves a live product page indexable', async () => {
    const meta = await generateMetadata(params('olympian-tee-sand-unisex'))
    expect(meta.robots).toBeUndefined()
    expect(meta.description).toContain('Olympian collection')
  })
})

describe('product page', () => {
  it('sends a retired product to the shop with a 308', async () => {
    mockIsRetired.mockResolvedValue(true)
    await expect(ProductPage(params('ink-butter-sport-tee-unisex'))).rejects.toThrow('NEXT_REDIRECT /shop')
  })

  it('answers an unknown slug with a 404', async () => {
    await expect(ProductPage(params('does-not-exist'))).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('sends an old numeric Printful id to the slug', async () => {
    await expect(ProductPage(params('433351254'))).rejects.toThrow('NEXT_REDIRECT /shop/olympian-tee-sand-unisex')
    await expect(ProductPage(params('999'))).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('renders a teaser as not for sale, without an Offer', async () => {
    render(await ProductPage(params('olympn-sport-oversized-hoodie-mocha')))
    const view = document.querySelector('[data-testid="product-view"]')
    expect(view).toHaveAttribute('data-purchasable', 'false')
    expect(view).toHaveAttribute('data-release', '1 November 2026 at 12:00 CET')
    expect(jsonLd('Product').offers).toBeUndefined()
    const rendered = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map((s) => s.textContent ?? '')
      .join('\n')
    expect(rendered).not.toContain('"offers"')
    expect(JSON.stringify(jsonLd('BreadcrumbList'))).toContain('/collections/olympn-sport')
  })

  it('gives a live product an Offer', async () => {
    render(await ProductPage(params('olympian-tee-sand-unisex')))
    expect(document.querySelector('[data-testid="product-view"]')).toHaveAttribute('data-purchasable', 'true')
    expect(jsonLd('Product').offers).toMatchObject({ lowPrice: '64.95', availability: 'https://schema.org/InStock' })
  })
})
