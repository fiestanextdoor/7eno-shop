/** @jest-environment node */
import type { ShopProduct } from '@/lib/catalog'
import { DROPS, type Drop, type DropStatus } from '@/lib/drops'
import { GET } from './route'

const mockGetShopProducts = jest.fn()
jest.mock('../../lib/catalog', () => ({
  getShopProducts: (...args: unknown[]) => mockGetShopProducts(...args),
}))

const [olympian, sport] = DROPS

function shopProduct(id: string, name: string, slug: string, drop: Drop, status: DropStatus): ShopProduct {
  const variant = (size: string) => ({
    provider: 'printful' as const, productId: id, id: `${id}-${size}`, name: `${name} / ${size}`, size,
    color: 'Maroon', colorCode: '#621926', priceCents: 4500, currency: 'EUR', inStock: true,
    imageUrl: 'https://files.cdn.printful.com/variant.png',
  })
  return {
    provider: 'printful', id, name, slug, thumbnailUrl: 'https://files.cdn.printful.com/thumb.png',
    colors: [], currency: 'EUR', priceCents: 4500, variants: [variant('M'), variant('4XL')],
    drop, status, purchasable: status === 'live', soldOut: false,
  }
}

const sand = shopProduct('1', 'Olympian Tee Sand Unisex', 'olympian-tee-sand-unisex', olympian, 'live')
const roseRed = (status: DropStatus) =>
  shopProduct('2', 'OLYMPN Sport Oversized Hoodie Rose Red', 'olympn-sport-oversized-hoodie-rose-red', sport, status)

async function feed(): Promise<string> {
  return (await GET()).text()
}

beforeEach(() => mockGetShopProducts.mockReset())

describe('GET /product-feed.xml', () => {
  it('lists live drop products only: a teaser never reaches Merchant Center', async () => {
    mockGetShopProducts.mockResolvedValue([sand, roseRed('upcoming')])
    const xml = await feed()
    expect(xml).toContain('/shop/olympian-tee-sand-unisex</link>')
    expect(xml).not.toContain('olympn-sport-oversized-hoodie-rose-red')
  })

  it('asks the catalogue without preview, so a QA cookie can never leak a teaser', async () => {
    mockGetShopProducts.mockResolvedValue([])
    await feed()
    expect(mockGetShopProducts).toHaveBeenCalledWith(expect.any(Number))
  })

  it('names the colour from the product, not from the Printful garment colour', async () => {
    mockGetShopProducts.mockResolvedValue([roseRed('live')])
    const xml = await feed()
    expect(xml).toContain('<g:color>Rose Red</g:color>')
    expect(xml).not.toContain('<g:color>Maroon</g:color>')
    expect(xml).toContain('<g:product_type>7ENO &gt; OLYMPN Sport &gt; Hoodies</g:product_type>')
    expect(xml).toContain('<g:gender>unisex</g:gender>')
  })

  it('skips the sizes the storefront hides', async () => {
    mockGetShopProducts.mockResolvedValue([sand])
    const xml = await feed()
    expect(xml).toContain('<g:size>M</g:size>')
    expect(xml).not.toContain('<g:size>4XL</g:size>')
  })
})
