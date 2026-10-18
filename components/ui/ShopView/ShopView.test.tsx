import { render, screen } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import ShopView from './ShopView'
import type { TileProduct } from '@/lib/tiles'

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }))

function tile(n: number): TileProduct {
  return {
    slug: `piece-${n}`, href: `/shop/piece-${n}`, name: `Piece ${n}`, image: '/drops/olympn-sport/mocha.webp',
    imageAlt: `Piece ${n}`, price: '€64.95', badges: [], note: null, dropId: 'olympn-sport', category: 'hoodies', priceCents: 6495,
  }
}

const TILES = [1, 2, 3, 4, 5, 6].map(tile)

beforeEach(() => {
  jest.mocked(useRouter).mockReturnValue({ push: jest.fn() } as unknown as ReturnType<typeof useRouter>)
})

describe('ShopView', () => {
  it('renders one tile per product, the first desktop row eager', () => {
    render(<ShopView filters={[]} sort="featured" sortOptions={[]} tiles={TILES} />)
    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(6)
    expect(images.slice(0, 4).every((img) => img.getAttribute('loading') === 'eager')).toBe(true)
    expect(images[4]).toHaveAttribute('loading', 'lazy')
  })

  it('titles each tile with an h2, straight under the page h1', () => {
    render(<ShopView filters={[]} sort="featured" sortOptions={[]} tiles={TILES} />)
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(TILES.map((t) => t.name))
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull()
  })

  it('offers no products-per-row switch: the grid is fixed', () => {
    render(<ShopView filters={[]} sort="featured" sortOptions={[]} tiles={TILES} />)
    expect(screen.queryByRole('radiogroup')).toBeNull()
  })

  it('shows the empty message instead of an empty grid', () => {
    render(<ShopView filters={[]} sort="featured" sortOptions={[]} tiles={[]} emptyMessage="No pieces match these filters yet." />)
    expect(screen.getByText('No pieces match these filters yet.')).toBeInTheDocument()
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('links an empty listing to the upcoming drop when one is given', () => {
    render(
      <ShopView
        filters={[]} sort="featured" sortOptions={[]} tiles={[]}
        emptyMessage="No pieces match these filters yet."
        emptyLink={{ href: '/collections/olympn-sport', label: 'See the drop and join the waitlist' }}
      />,
    )
    expect(screen.getByText('No pieces match these filters yet.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'See the drop and join the waitlist' })).toHaveAttribute('href', '/collections/olympn-sport')
  })
})
