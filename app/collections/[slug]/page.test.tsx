import { render, screen } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import type { ShopProduct } from '@/lib/catalog'
import { DROPS, type Drop } from '@/lib/drops'
import type { TileProduct } from '@/lib/tiles'
import CollectionPage, { generateMetadata, generateStaticParams } from './page'

const mockGetShopProducts = jest.fn()
const mockToTiles = jest.fn()
const mockIsPreviewSession = jest.fn()
const mockGetDropBySlug = jest.fn()
const mockDrops = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
}))
jest.mock('../../../lib/catalog', () => ({ getShopProducts: (...args: unknown[]) => mockGetShopProducts(...args) }))
jest.mock('../../../lib/tiles', () => ({ toTiles: (...args: unknown[]) => mockToTiles(...args) }))
jest.mock('../../../lib/drops', () => {
  const actual = jest.requireActual('../../../lib/drops')
  return {
    ...actual,
    get DROPS() {
      return mockDrops() ?? actual.DROPS
    },
    getDropBySlug: (slug: string) => mockGetDropBySlug(slug) ?? actual.getDropBySlug(slug),
  }
})
jest.mock('../../../lib/preview-session', () => ({ isPreviewSession: () => mockIsPreviewSession() }))

const [olympian, sport] = DROPS
const BEFORE = Date.parse('2026-10-14T10:00:00Z')

// An upcoming drop without a teaser: hidden until its release.
const SECRET: Drop = {
  ...sport,
  id: 'olympn-sport',
  slug: 'secret',
  title: 'Secret',
  teaser: false,
  window: { startsAt: '2027-01-01T12:00:00+01:00', endsAt: null },
}

const params = (slug: string) => ({ params: Promise.resolve({ slug }) })

function product(id: string, name: string, drop = olympian): ShopProduct {
  return {
    provider: 'printful', id, name, slug: id, thumbnailUrl: null, variants: [], colors: [], currency: 'EUR',
    drop, status: 'live', purchasable: true, soldOut: false,
  }
}

const TILE: TileProduct = {
  slug: 'olympian-tee-sand-unisex', href: '/shop/olympian-tee-sand-unisex', name: 'Olympian Tee Sand Unisex',
  image: '/olympian/olympian-wheat-model.jpg', imageAlt: 'Olympian Tee Sand Unisex', price: '€34.95', badges: [], note: null,
}

beforeEach(() => {
  jest.spyOn(Date, 'now').mockReturnValue(BEFORE)
  jest.mocked(useRouter).mockReturnValue({ refresh: jest.fn(), push: jest.fn() } as unknown as ReturnType<typeof useRouter>)
  mockGetDropBySlug.mockReset().mockReturnValue(null)
  mockDrops.mockReset().mockReturnValue(undefined)
  mockIsPreviewSession.mockReset().mockResolvedValue(false)
  mockGetShopProducts.mockReset().mockResolvedValue([])
  mockToTiles.mockReset().mockResolvedValue([])
})

afterEach(() => jest.restoreAllMocks())

describe('/collections/[slug]', () => {
  it('pre-renders one page per drop', () => {
    expect(generateStaticParams()).toEqual([{ slug: 'olympian' }, { slug: 'olympn-sport' }])
  })

  it('does not pre-render an upcoming drop without a teaser', () => {
    mockDrops.mockReturnValue([olympian, SECRET])
    expect(generateStaticParams()).toEqual([{ slug: 'olympian' }])
  })

  it('gives every collection its own title and canonical', async () => {
    const meta = await generateMetadata(params('olympn-sport'))
    expect(meta.title).toBe('OLYMPN Sport · Edition 02')
    expect(meta.description).toBe(sport.intro)
    expect(meta.alternates?.canonical).toBe('/collections/olympn-sport')
  })

  it('is a 404 for a slug that is not a drop', async () => {
    await expect(CollectionPage(params('og'))).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('is a 404 for an upcoming drop without a teaser', async () => {
    mockGetDropBySlug.mockImplementation((slug: string) => (slug === 'secret' ? SECRET : null))
    await expect(CollectionPage(params('secret'))).rejects.toThrow('NEXT_NOT_FOUND')
    expect(mockGetShopProducts).not.toHaveBeenCalled()
  })

  it('shows the countdown, the waitlist and the line-up of a teaser drop without products', async () => {
    render(await CollectionPage(params('olympn-sport')))
    expect(screen.getByRole('heading', { level: 1, name: 'OLYMPN Sport' })).toBeInTheDocument()
    expect(screen.getByText('1 November 2026 at 12:00 CET')).toBeInTheDocument()
    expect(screen.getByLabelText('Get notified when it drops')).toBeInTheDocument()
    expect(screen.getAllByRole('img', { name: /OLYMPN Sport line-up/ })).toHaveLength(8)
  })

  it('shows the grid of the drop, and only that drop, once it has products', async () => {
    mockGetShopProducts.mockResolvedValue([product('1', 'Olympian Tee Sand Unisex'), product('2', 'OLYMPN Sport Oversized Hoodie Mocha', sport)])
    mockToTiles.mockResolvedValue([TILE])
    render(await CollectionPage(params('olympian')))
    expect(mockToTiles.mock.calls[0][0].map((p: ShopProduct) => p.drop.id)).toEqual(['olympian'])
    expect(screen.getByRole('link', { name: /Olympian Tee Sand Unisex/ })).toHaveAttribute('href', '/shop/olympian-tee-sand-unisex')
    expect(screen.getByRole('radiogroup', { name: 'Products per row' })).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /line-up/ })).toBeNull()
  })

  it('treats the drop as live in preview', async () => {
    mockIsPreviewSession.mockResolvedValue(true)
    render(await CollectionPage(params('olympn-sport')))
    expect(screen.getByText('Live now')).toBeInTheDocument()
    expect(mockGetShopProducts).toHaveBeenCalledWith(BEFORE, { preview: true })
  })
})
