import { render, screen, within } from '@testing-library/react'
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
      price: '€34.95', badges: [], note: null, dropId: 'olympian', category: 'tees', priceCents: 3495,
    })),
}))

const [olympian, sport] = DROPS
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
    expect([...document.querySelectorAll('[id^="row-"]')].map((h) => h.textContent)).toEqual(['OLYMPN Sport', 'Olympian'])
    // The whole line-up, in a scrolling row with arrows (four in view at a time).
    expect(screen.getAllByRole('img', { name: /OLYMPN Sport line-up/ })).toHaveLength(8)
    // Only the eight-piece line-up needs arrows; the Olympian row has one product here.
    expect(screen.getAllByRole('button', { name: 'Next products' })).toHaveLength(1)
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

  it('puts the photo of the next drop in the hero and loads it first', async () => {
    render(await HomePage())
    const photo = screen.getByRole('img', { name: sport.hero.alt })
    expect(photo).toHaveAttribute('loading', 'eager')
    expect(photo).toHaveAttribute('fetchpriority', 'high')
  })

  it('has an Olympian photo band with the campaign still and four model photos', async () => {
    render(await HomePage())
    const band = screen.getByRole('region', { name: 'Olympian in four colours' })
    expect(within(band).getByRole('img', { name: 'Olympian campaign still' })).toBeInTheDocument()
    expect(within(band).getAllByRole('img', { name: /^Olympian model photo/ })).toHaveLength(4)
    expect(within(band).getByRole('link', { name: 'Shop Olympian' })).toHaveAttribute('href', '/collections/olympian')
  })

  it('has a social band with the Instagram and TikTok profiles and four posts', async () => {
    render(await HomePage())
    const band = document.querySelector('[data-band="social"]') as HTMLElement
    expect(band).not.toBeNull()
    expect(within(band).getByRole('link', { name: '@7enobyabraent' })).toHaveAttribute('href', 'https://www.instagram.com/7enobyabraent/')
    expect(within(band).getByRole('link', { name: '@7enobyabraentertainment' })).toHaveAttribute('href', 'https://www.tiktok.com/@7enobyabraentertainment')
    expect(within(within(band).getByRole('list', { name: 'Latest Instagram posts' })).getAllByRole('link')).toHaveLength(4)
    expect(band.querySelector('video')).toBeNull()
  })

  it('ends with a waitlist strip for every future edition', async () => {
    render(await HomePage())
    const strip = screen.getByRole('region', { name: 'Never miss an edition' })
    expect(within(strip).getByLabelText('Email for drop alerts')).toBeInTheDocument()
  })
})
