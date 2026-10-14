import { render, screen } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import type { ShopProduct } from '@/lib/catalog'
import { DROPS } from '@/lib/drops'
import type { TileProduct } from '@/lib/tiles'
import HomePage from './page'

const mockGetShopProducts = jest.fn()
const mockIsPreviewSession = jest.fn()

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }))
jest.mock('../lib/catalog', () => ({ getShopProducts: (...args: unknown[]) => mockGetShopProducts(...args) }))
jest.mock('../lib/preview-session', () => ({ isPreviewSession: () => mockIsPreviewSession() }))
jest.mock('../lib/tiles', () => ({
  toTiles: async (products: { slug: string; name: string }[]): Promise<TileProduct[]> =>
    products.map((p) => ({
      slug: p.slug, href: `/shop/${p.slug}`, name: p.name, image: null, imageAlt: p.name,
      price: '€34.95', badges: [], note: null,
    })),
}))

const [olympian] = DROPS
const BEFORE = Date.parse('2026-10-14T10:00:00Z')
const AFTER = Date.parse('2026-11-02T10:00:00Z')

function product(slug: string, name: string): ShopProduct {
  return {
    provider: 'printful', id: slug, name, slug, thumbnailUrl: null, variants: [], colors: [], currency: 'EUR',
    drop: olympian, status: 'live', purchasable: true, soldOut: false,
  }
}

beforeEach(() => {
  jest.spyOn(Date, 'now').mockReturnValue(BEFORE)
  jest.mocked(useRouter).mockReturnValue({ refresh: jest.fn() } as unknown as ReturnType<typeof useRouter>)
  mockIsPreviewSession.mockReset().mockResolvedValue(false)
  mockGetShopProducts.mockReset().mockResolvedValue([
    product('olympian-tee-ocean-unisex', 'Olympian Tee Ocean Unisex'),
    product('olympian-tee-sand-unisex', 'Olympian Tee Sand Unisex'),
  ])
})

afterEach(() => jest.restoreAllMocks())

describe('home', () => {
  it('leads with the next drop: countdown and waitlist before the release', async () => {
    render(await HomePage())
    expect(screen.getByRole('heading', { level: 1, name: 'OLYMPN Sport' })).toBeInTheDocument()
    expect(screen.getByText('1 November 2026 at 12:00 CET')).toBeInTheDocument()
    expect(screen.getByLabelText('Get notified when it drops')).toBeInTheDocument()
  })

  it('shows Shop the drop once it is live', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(AFTER)
    render(await HomePage())
    expect(screen.getByRole('link', { name: 'Shop the drop' })).toHaveAttribute('href', '/collections/olympn-sport')
  })

  it('has one row per edition, newest first, with tiles or the line-up', async () => {
    render(await HomePage())
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['OLYMPN Sport', 'Olympian'])
    expect(screen.getAllByRole('img', { name: /OLYMPN Sport line-up/ })).toHaveLength(4)
    expect(screen.getByRole('link', { name: /Olympian Tee Sand Unisex/ })).toHaveAttribute('href', '/shop/olympian-tee-sand-unisex')
    expect(screen.getAllByRole('link', { name: 'View the collection' }).map((a) => a.getAttribute('href'))).toEqual([
      '/collections/olympn-sport',
      '/collections/olympian',
    ])
  })

  it('no longer shows deals or the old lookbook', async () => {
    render(await HomePage())
    expect(screen.queryByText(/Deals/)).toBeNull()
    expect(document.querySelector('a[href^="/deals"]')).toBeNull()
  })

  it('treats the next drop as live in preview', async () => {
    mockIsPreviewSession.mockResolvedValue(true)
    render(await HomePage())
    expect(mockGetShopProducts).toHaveBeenCalledWith(BEFORE, { preview: true })
    expect(screen.getByRole('link', { name: 'Shop the drop' })).toBeInTheDocument()
  })
})
