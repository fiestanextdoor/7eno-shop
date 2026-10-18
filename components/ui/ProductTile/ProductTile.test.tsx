import { render, screen } from '@testing-library/react'
import ProductTile from './ProductTile'
import type { TileProduct } from '@/lib/tiles'

const tile: TileProduct = {
  slug: 'olympn-sport-oversized-hoodie-mocha',
  href: '/shop/olympn-sport-oversized-hoodie-mocha',
  name: 'OLYMPN Sport Oversized Hoodie Mocha',
  image: '/drops/olympn-sport/mocha.webp',
  imageAlt: 'OLYMPN Sport Oversized Hoodie Mocha',
  price: '€64.95',
  badges: ['coming'],
  note: 'Drops 1 November 2026 at 12:00 CET',
  dropId: 'olympn-sport',
  category: 'hoodies',
  priceCents: 6495,
}

describe('ProductTile', () => {
  it('links the whole tile to the product page', () => {
    render(<ProductTile product={tile} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/shop/olympn-sport-oversized-hoodie-mocha')
    expect(screen.getByRole('heading', { name: 'OLYMPN Sport Oversized Hoodie Mocha' })).toBeInTheDocument()
  })

  it('renders the name as h3 by default and as h2 under a page heading', () => {
    const { rerender } = render(<ProductTile product={tile} />)
    expect(screen.getByRole('heading', { level: 3, name: tile.name })).toBeInTheDocument()
    rerender(<ProductTile product={tile} headingLevel="h2" />)
    expect(screen.getByRole('heading', { level: 2, name: tile.name })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull()
  })

  it('lazy-loads the image by default and eagerly in the first row', () => {
    const { rerender } = render(<ProductTile product={tile} />)
    expect(screen.getByRole('img', { name: tile.imageAlt })).toHaveAttribute('loading', 'lazy')
    rerender(<ProductTile product={tile} eager />)
    expect(screen.getByRole('img', { name: tile.imageAlt })).toHaveAttribute('loading', 'eager')
  })

  it('shows price, badge and release note', () => {
    render(<ProductTile product={tile} />)
    expect(screen.getByText('€64.95')).toBeInTheDocument()
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
    expect(screen.getByText('Drops 1 November 2026 at 12:00 CET')).toBeInTheDocument()
  })

  it('keeps the 4:5 frame with a placeholder when there is no image', () => {
    const { container } = render(<ProductTile product={{ ...tile, image: null }} />)
    expect(screen.queryByRole('img')).toBeNull()
    expect(container.querySelector('.placeholder')).not.toBeNull()
  })
})
