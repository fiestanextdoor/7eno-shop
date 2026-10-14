import { render, screen } from '@testing-library/react'
import type { ShopProduct } from '@/lib/catalog'
import { DROPS, type Drop } from '@/lib/drops'
import SizeGuidePage from './page'

const mockGetShopProducts = jest.fn()
jest.mock('../../lib/catalog', () => ({ getShopProducts: (...args: unknown[]) => mockGetShopProducts(...args) }))
jest.mock('../../lib/printful', () => ({
  getProduct: async (id: string) => ({ sync_variants: [{ variant_id: Number(id.length), size: 'M' }] }),
  getCatalogProductId: async (variantId: number) => variantId,
  getSizeGuide: async (catalogId: number) => ({
    unit: 'cm',
    sizes: ['M', 'L'],
    rows: [{ label: 'Chest', values: { M: `${100 + catalogId}`, L: '' } }],
  }),
}))

const [olympian, sport] = DROPS

function product(name: string, drop: Drop): ShopProduct {
  const slug = name.toLowerCase().replace(/\s+/g, '-')
  return {
    provider: 'printful', id: slug, name, slug, thumbnailUrl: null, variants: [], colors: [], currency: 'EUR',
    drop, status: 'live', purchasable: true, soldOut: false,
  }
}

beforeEach(() => {
  mockGetShopProducts.mockReset().mockResolvedValue([
    product('Olympian Tee Ocean Unisex', olympian),
    product('OLYMPN Sport Oversized Hoodie Mocha', sport),
    product('OLYMPN Sport Relaxed Hoodie Dune Long', sport),
  ])
})

describe('size guide', () => {
  it('shows a table per OLYMPN Sport cut and none for the retired OG range', async () => {
    render(await SizeGuidePage())
    expect(screen.getByRole('heading', { level: 2, name: 'OLYMPN Sport oversized hoodie' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'OLYMPN Sport relaxed hoodie' })).toBeInTheDocument()
    expect(screen.queryByText(/OG tee/)).toBeNull()
  })

  it('captions tables with a colon and marks empty cells with a hyphen', async () => {
    render(await SizeGuidePage())
    expect(screen.getByText('OLYMPN Sport oversized hoodie: body measurements (cm)')).toBeInTheDocument()
    expect(screen.getAllByRole('cell', { name: '-' }).length).toBeGreaterThan(0)
  })

  it('contains no long dashes', async () => {
    const { container } = render(await SizeGuidePage())
    expect(container.textContent).not.toMatch(/[–—]/)
  })
})
