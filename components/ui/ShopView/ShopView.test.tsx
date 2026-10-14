import { render, screen, fireEvent, within } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import ShopView from './ShopView'
import type { TileProduct } from '@/lib/tiles'

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }))

function tile(n: number): TileProduct {
  return {
    slug: `piece-${n}`, href: `/shop/piece-${n}`, name: `Piece ${n}`, image: '/drops/olympn-sport/mocha.webp',
    imageAlt: `Piece ${n}`, price: '€64.95', badges: [], note: null,
  }
}

const TILES = [1, 2, 3, 4, 5, 6].map(tile)

beforeEach(() => {
  window.localStorage.clear()
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

  it('switches the desktop grid to two per row', () => {
    const { container } = render(<ShopView filters={[]} sort="featured" sortOptions={[]} tiles={TILES} />)
    const grid = container.querySelector('ul[data-desktop]')
    expect(grid).toHaveAttribute('data-desktop', '4')
    const desktop = screen.getByRole('radiogroup', { name: 'Products per row' })
    fireEvent.click(within(desktop).getByRole('radio', { name: '2 per row' }))
    expect(grid).toHaveAttribute('data-desktop', '2')
  })

  it('switches the mobile grid to one per row', () => {
    const { container } = render(<ShopView filters={[]} sort="featured" sortOptions={[]} tiles={TILES} />)
    const mobile = screen.getByRole('radiogroup', { name: 'Products per row (mobile)' })
    fireEvent.click(within(mobile).getByRole('radio', { name: '1 per row' }))
    expect(container.querySelector('ul[data-mobile]')).toHaveAttribute('data-mobile', '1')
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
