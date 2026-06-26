import { render, screen, fireEvent } from '@testing-library/react'
import QuickAddCard from './QuickAddCard'
import type { CarouselItem } from './ProductCarousel'
import { useCartStore } from '@/store/cart'

const item: CarouselItem = {
  slug: 'olympus-tee',
  name: 'Olympus Tee',
  image: null,
  provider: 'printful',
  productId: 'p1',
  currency: 'EUR',
  colors: [{ color: 'Black', hex: '#111', displayName: 'Black', image: null }],
  variants: [
    { id: 'v-m', color: 'Black', size: 'M', name: 'M / Black', priceCents: 2995, inStock: true },
    { id: 'v-l', color: 'Black', size: 'L', name: 'L / Black', priceCents: 2995, inStock: true },
  ],
}

const multiColour: CarouselItem = {
  ...item,
  image: '/img/black.png',
  colors: [
    { color: 'Black', hex: '#111111', displayName: 'Black', image: '/img/black.png' },
    { color: 'Maroon', hex: '#7b1f2b', displayName: 'Maroon', image: '/img/maroon.png' },
  ],
  variants: [
    { id: 'b-m', color: 'Black', size: 'M', name: 'M / Black', priceCents: 2995, inStock: true },
    { id: 'r-m', color: 'Maroon', size: 'M', name: 'M / Maroon', priceCents: 2995, inStock: true },
  ],
}

beforeEach(() => useCartStore.setState({ items: [], isCartOpen: false }))

describe('QuickAddCard quick-add', () => {
  it('merges the same size added twice into one line with quantity 2', () => {
    render(<QuickAddCard item={item} />)
    const m = screen.getByRole('menuitem', { name: 'M' })
    fireEvent.click(m)
    fireEvent.click(screen.getByRole('menuitem', { name: 'M' }))
    const items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(2)
  })

  it('keeps two different sizes as separate lines', () => {
    render(<QuickAddCard item={item} />)
    fireEvent.click(screen.getByRole('menuitem', { name: 'M' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'L' }))
    expect(useCartStore.getState().items).toHaveLength(2)
  })

  it('opens the cart drawer after adding', () => {
    render(<QuickAddCard item={item} />)
    fireEvent.click(screen.getByRole('menuitem', { name: 'M' }))
    expect(useCartStore.getState().isCartOpen).toBe(true)
  })

  it('swaps the photo and the added variant when another colour is picked', () => {
    render(<QuickAddCard item={multiColour} />)
    expect(screen.getByRole('img')).toHaveAccessibleName(/Black/)
    fireEvent.click(screen.getByRole('button', { name: 'Maroon' }))
    expect(screen.getByRole('img')).toHaveAccessibleName(/Maroon/)
    fireEvent.click(screen.getByRole('menuitem', { name: 'M' }))
    expect(useCartStore.getState().items[0].variantId).toBe('r-m')
  })
})
