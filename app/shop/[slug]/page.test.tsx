import type { ShopProduct } from '@/lib/catalog'
import { DROPS, type Drop, type DropStatus } from '@/lib/drops'
import { generateMetadata } from './page'

const mockGetShopProducts = jest.fn()
jest.mock('../../../lib/catalog', () => ({
  ...jest.requireActual('../../../lib/catalog'),
  getShopProducts: (...args: unknown[]) => mockGetShopProducts(...args),
}))
jest.mock('../../../lib/preview-session', () => ({ isPreviewSession: async () => false }))

const [olympian, sport] = DROPS

function product(name: string, slug: string, drop: Drop, status: DropStatus): ShopProduct {
  return {
    provider: 'printful', id: slug, name, slug, thumbnailUrl: null, variants: [], colors: [], currency: 'EUR',
    drop, status, purchasable: status === 'live', soldOut: false,
  }
}

const params = (slug: string) => ({ params: Promise.resolve({ slug }) })

beforeEach(() => {
  mockGetShopProducts.mockReset().mockResolvedValue([
    product('OLYMPN Sport Oversized Hoodie Mocha', 'olympn-sport-oversized-hoodie-mocha', sport, 'upcoming'),
    product('Olympian Tee Sand Unisex', 'olympian-tee-sand-unisex', olympian, 'live'),
  ])
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
