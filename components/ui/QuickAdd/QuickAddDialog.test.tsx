import { render, screen, fireEvent, within } from '@testing-library/react'
import QuickAddDialog from './QuickAddDialog'
import type { TileProduct } from '@/lib/tiles'
import { useCartStore } from '@/store/cart'
import type { NormalizedVariant } from '@/types/catalog'

function variant(id: string, size: string, inStock = true): NormalizedVariant {
  return {
    provider: 'printful', productId: 'p1', id, name: `Olympian Tee Sand Unisex / ${size}`, size, color: 'Sand',
    colorCode: '#E8D9B0', priceCents: 3495, currency: 'EUR', inStock, imageUrl: null,
  }
}

function tile(slug: string, name: string, extra: Partial<TileProduct> = {}): TileProduct {
  return {
    slug, href: `/shop/${slug}`, name, image: null, imageAlt: name, price: '€34.95', badges: [], note: null,
    dropId: 'olympian', category: 'tees', priceCents: 3495,
    quick: {
      provider: 'printful', productId: slug, variants: [variant(`${slug}-s`, 'S'), variant(`${slug}-m`, 'M'), variant(`${slug}-l`, 'L', false)],
      soldOut: false,
      colours: [
        { name: 'Sand', hex: '#E8D9B0', slug: 'tee-sand', current: slug === 'tee-sand', soldOut: false },
        { name: 'Ocean', hex: '#5B8FA8', slug: 'tee-ocean', current: slug === 'tee-ocean', soldOut: false },
      ],
    },
    ...extra,
  }
}

const SAND = tile('tee-sand', 'Olympian Tee Sand Unisex')
const OCEAN = tile('tee-ocean', 'Olympian Tee Ocean Unisex')

beforeEach(() => {
  useCartStore.setState({ items: [], isCartOpen: false })
})

describe('QuickAddDialog', () => {
  it('renders nothing while closed', () => {
    render(<QuickAddDialog tile={null} tiles={[SAND]} onClose={jest.fn()} onSwitch={jest.fn()} />)
    expect(screen.getByRole('dialog', { hidden: true })).toBeEmptyDOMElement()
  })

  it('asks for a size first, then adds the chosen variant and confirms', () => {
    const onClose = jest.fn()
    render(<QuickAddDialog tile={SAND} tiles={[SAND, OCEAN]} onClose={onClose} onSwitch={jest.fn()} />)
    const dialog = screen.getByRole('dialog', { hidden: true })
    expect(within(dialog).getByRole('button', { name: 'Select a size' })).toBeDisabled()
    fireEvent.click(within(dialog).getByRole('radio', { name: 'M' }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add to cart' }))
    expect(useCartStore.getState().items).toEqual([expect.objectContaining({ variantId: 'tee-sand-m', quantity: 1 })])
    expect(within(dialog).getByText('Added to cart')).toBeInTheDocument()
    expect(within(dialog).getByText('Size M')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'View cart' }))
    expect(onClose).toHaveBeenCalled()
    expect(useCartStore.getState().isCartOpen).toBe(true)
  })

  it('switches to a sibling colour that is on the page, and links to one that is not', () => {
    const onSwitch = jest.fn()
    const { rerender } = render(<QuickAddDialog tile={SAND} tiles={[SAND, OCEAN]} onClose={jest.fn()} onSwitch={onSwitch} />)
    fireEvent.click(screen.getByRole('button', { name: 'Ocean', hidden: true }))
    expect(onSwitch).toHaveBeenCalledWith(OCEAN)
    rerender(<QuickAddDialog tile={SAND} tiles={[SAND]} onClose={jest.fn()} onSwitch={onSwitch} />)
    expect(screen.getByRole('link', { name: 'Ocean', hidden: true })).toHaveAttribute('href', '/shop/tee-ocean')
  })

  it('sends a sold-out piece to its page for the waitlist', () => {
    const soldOut = tile('tee-sand', 'Olympian Tee Sand Unisex', { quick: { ...SAND.quick!, soldOut: true } })
    render(<QuickAddDialog tile={soldOut} tiles={[soldOut]} onClose={jest.fn()} onSwitch={jest.fn()} />)
    expect(screen.getByRole('link', { name: /Sold out/, hidden: true })).toHaveAttribute('href', '/shop/tee-sand')
    expect(screen.queryByRole('button', { name: 'Add to cart', hidden: true })).toBeNull()
  })
})
