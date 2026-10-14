/** @jest-environment node */
import type { ShopProduct } from '@/lib/catalog'
import { DROPS } from '@/lib/drops'
import sitemap from './sitemap'

const mockGetShopProducts = jest.fn()
jest.mock('../lib/catalog', () => ({
  getShopProducts: (...args: unknown[]) => mockGetShopProducts(...args),
}))

const [olympian, sport] = DROPS
const BEFORE_SPORT = Date.parse('2026-10-14T10:00:00Z')

const base = { provider: 'printful' as const, colors: [], currency: 'EUR', variants: [], soldOut: false }
const live: ShopProduct = {
  ...base, id: '1', name: 'Olympian Tee Sand Unisex', slug: 'olympian-tee-sand-unisex',
  thumbnailUrl: 'https://files.cdn.printful.com/sand.png', drop: olympian, status: 'live', purchasable: true,
}
const teaser: ShopProduct = {
  ...base, id: '2', name: 'OLYMPN Sport Oversized Hoodie Mocha', slug: 'olympn-sport-oversized-hoodie-mocha',
  thumbnailUrl: null, drop: sport, status: 'upcoming', purchasable: false,
}

async function paths(): Promise<string[]> {
  return (await sitemap()).map((entry) => entry.url.replace(/^https?:\/\/[^/]+/, '') || '/')
}

beforeEach(() => {
  jest.spyOn(Date, 'now').mockReturnValue(BEFORE_SPORT)
  mockGetShopProducts.mockReset().mockResolvedValue([live, teaser])
})

afterEach(() => jest.restoreAllMocks())

describe('sitemap', () => {
  it('lists the v2 pages and both collection landings', async () => {
    expect(await paths()).toEqual(
      expect.arrayContaining(['/', '/shop', '/archive', '/collections/olympian', '/collections/olympn-sport', '/about', '/faq'])
    )
  })

  it('drops every retired v1 URL', async () => {
    for (const p of await paths()) {
      expect(p).not.toMatch(/\/deals|^\/olympian|\?line=|\?gender=|coming-soon/)
    }
  })

  it('lists live drop products only: a teaser product page stays out', async () => {
    const list = await paths()
    expect(list).toContain('/shop/olympian-tee-sand-unisex')
    expect(list).not.toContain('/shop/olympn-sport-oversized-hoodie-mocha')
    expect(mockGetShopProducts).toHaveBeenCalledWith(BEFORE_SPORT)
  })

  it('attaches the product image for Google Images', async () => {
    const entry = (await sitemap()).find((e) => e.url.endsWith('/shop/olympian-tee-sand-unisex'))
    expect(entry?.images).toEqual(['https://files.cdn.printful.com/sand.png'])
  })

  it('keeps the static pages when the catalogue fails', async () => {
    mockGetShopProducts.mockRejectedValue(new Error('printful down'))
    expect(await paths()).toEqual(expect.arrayContaining(['/', '/shop', '/archive']))
  })
})
