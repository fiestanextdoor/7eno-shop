import { render, screen, fireEvent } from '@testing-library/react'
import ProductRow from './ProductRow'
import type { TileProduct } from '@/lib/tiles'

function tile(n: number): TileProduct {
  return {
    slug: `piece-${n}`, href: `/shop/piece-${n}`, name: `Piece ${n}`, image: null, imageAlt: `Piece ${n}`,
    price: '€49.95', badges: [], note: null, dropId: 'olympian', category: 'tees', priceCents: 4995,
  }
}

describe('ProductRow', () => {
  it('shows every tile of the collection, and arrows only when there is more than one page', () => {
    const { rerender } = render(<ProductRow tiles={[1, 2, 3, 4].map(tile)} labelledBy="row-x" />)
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    expect(screen.queryByRole('button', { name: 'Next products' })).toBeNull()
    rerender(<ProductRow tiles={[1, 2, 3, 4, 5, 6].map(tile)} labelledBy="row-x" />)
    expect(screen.getAllByRole('listitem')).toHaveLength(6)
    expect(screen.getByRole('button', { name: 'Next products' })).toBeInTheDocument()
  })

  it('pages the track by its own width and disables the arrow at the start', () => {
    render(<ProductRow tiles={[1, 2, 3, 4, 5, 6].map(tile)} labelledBy="row-x" />)
    const track = screen.getByRole('list')
    const scrollBy = jest.fn()
    // jsdom has no layout: give the track two pages and tell it to re-measure.
    Object.defineProperty(track, 'scrollBy', { value: scrollBy })
    Object.defineProperty(track, 'clientWidth', { value: 800 })
    Object.defineProperty(track, 'scrollWidth', { value: 1600 })
    fireEvent.scroll(track)
    expect(screen.getByRole('button', { name: 'Previous products' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next products' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Next products' }))
    expect(scrollBy).toHaveBeenCalledWith({ left: 800, behavior: 'smooth' })
  })

  it('loads only the first visible tiles eagerly', () => {
    render(<ProductRow tiles={[1, 2, 3, 4, 5, 6].map((n) => ({ ...tile(n), image: '/drops/olympn-sport/mocha.webp' }))} labelledBy="row-x" eager />)
    const images = screen.getAllByRole('img')
    expect(images.slice(0, 4).every((img) => img.getAttribute('loading') === 'eager')).toBe(true)
    expect(images[4]).toHaveAttribute('loading', 'lazy')
  })
})
