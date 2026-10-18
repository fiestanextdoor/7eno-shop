import { render, screen, fireEvent, within } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import ShopBrowser from './ShopBrowser'
import type { FilterDrop } from '@/lib/shop-query'
import type { TileProduct } from '@/lib/tiles'

jest.mock('next/navigation', () => ({ useRouter: jest.fn(), useSearchParams: jest.fn() }))

const DROPS: FilterDrop[] = [
  { id: 'olympian', slug: 'olympian', title: 'Olympian', edition: 1, status: 'live' },
  { id: 'olympn-sport', slug: 'olympn-sport', title: 'OLYMPN Sport', edition: 2, status: 'upcoming' },
]

function tile(slug: string, name: string, dropId: TileProduct['dropId'], category: TileProduct['category'], priceCents: number | null): TileProduct {
  return { slug, href: `/shop/${slug}`, name, image: null, imageAlt: name, price: null, badges: [], note: null, dropId, category, priceCents }
}

const TILES = [
  tile('tee', 'Olympian Tee Sand', 'olympian', 'tees', 3495),
  tile('knit', 'Olympian Knitted Tee Ocean', 'olympian', 'knits', 5495),
  tile('bag', 'Olympian Backpack', 'olympian', 'bags', null),
]

function withParams(search: string) {
  jest.mocked(useSearchParams).mockReturnValue(new URLSearchParams(search) as unknown as ReturnType<typeof useSearchParams>)
}

// Tile headings only: the filter drawer has an h2 of its own.
const names = () => screen.getAllByRole('heading', { level: 2 }).filter((h) => h.closest('article')).map((h) => h.textContent)

beforeEach(() => {
  jest.mocked(useRouter).mockReturnValue({ push: jest.fn() } as unknown as ReturnType<typeof useRouter>)
  jest.spyOn(window.history, 'pushState').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('ShopBrowser', () => {
  it('shows every tile and the plain title without filters', () => {
    withParams('')
    render(<ShopBrowser tiles={TILES} drops={DROPS} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Shop all')
    expect(names()).toEqual(['Olympian Tee Sand', 'Olympian Knitted Tee Ocean', 'Olympian Backpack'])
  })

  it('filters and sorts from the URL on the first render', () => {
    withParams('collection=olympian&sort=price-desc')
    render(<ShopBrowser tiles={TILES} drops={DROPS} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Olympian')
    expect(names()).toEqual(['Olympian Knitted Tee Ocean', 'Olympian Tee Sand', 'Olympian Backpack'])
    withParams('category=knits')
    render(<ShopBrowser tiles={TILES} drops={DROPS} />)
    expect(screen.getAllByRole('heading', { level: 1 })[1]).toHaveTextContent('Knits')
  })

  it('applies a chip by rewriting the URL instead of navigating', () => {
    withParams('')
    render(<ShopBrowser tiles={TILES} drops={DROPS} />)
    const bar = screen.getByRole('navigation', { name: 'Filters' })
    fireEvent.click(within(bar).getByRole('link', { name: 'Knits' }))
    expect(window.history.pushState).toHaveBeenCalledWith(null, '', '/shop?category=knits')
    expect(useRouter().push).not.toHaveBeenCalled()
  })

  it('applies the sort the same way', () => {
    withParams('category=tees')
    render(<ShopBrowser tiles={TILES} drops={DROPS} />)
    const [select] = screen.getAllByRole('combobox', { name: 'Sort' })
    fireEvent.change(select, { target: { value: 'price-asc' } })
    expect(window.history.pushState).toHaveBeenCalledWith(null, '', '/shop?category=tees&sort=price-asc')
  })

  it('points an empty upcoming collection to its waitlist', () => {
    withParams('collection=olympn-sport')
    render(<ShopBrowser tiles={TILES} drops={DROPS} />)
    expect(screen.getByText('No pieces match these filters yet.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'See the drop and join the waitlist' })).toHaveAttribute('href', '/collections/olympn-sport')
  })
})
