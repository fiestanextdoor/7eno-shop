import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { useCartStore } from '@/store/cart'
import type { CartItem } from '@/types/cart'
import CartDrawer from './CartDrawer'
import { sizeFromVariantName } from './CartLine'

const NAME = 'OLYMPN Sport Oversized Hoodie Mocha'

function item(overrides: Partial<CartItem> = {}): CartItem {
  return {
    provider: 'printful', variantId: 'v1', productId: 'p1', productName: NAME,
    variantName: `${NAME} / M`, price: '45.00', currency: 'EUR', quantity: 1,
    imageUrl: '/drops/olympn-sport/mocha.webp', ...overrides,
  }
}

function openWith(items: CartItem[]) {
  useCartStore.setState({ items, isCartOpen: true })
  return render(<CartDrawer />)
}

const row = (label: string) => screen.getByText(label).parentElement as HTMLElement
const quantity = () => screen.getByRole('group', { name: `Quantity of ${NAME}` })

describe('CartDrawer', () => {
  it('is a labelled dialog with the line, the subtotal and the checkout link', () => {
    openWith([item()])
    expect(screen.getByRole('dialog', { name: 'Cart' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: NAME })).toHaveAttribute('href', '/shop/olympn-sport-oversized-hoodie-mocha')
    expect(screen.getByText('Size M')).toBeInTheDocument()
    expect(row('Subtotal')).toHaveTextContent('€45.00')
    expect(screen.getByRole('link', { name: 'Checkout' })).toHaveAttribute('href', '/checkout')
  })

  it('shows how far the order is from free shipping', () => {
    openWith([item()])
    expect(screen.getByRole('progressbar', { name: 'Progress to free shipping' }).previousElementSibling).toHaveTextContent('€30.00 away from free shipping.')
    expect(screen.getByRole('progressbar', { name: 'Progress to free shipping' })).toHaveAttribute('aria-valuenow', '60')
  })

  it('updates the line, the subtotal and the free-shipping line on plus', () => {
    openWith([item()])
    fireEvent.click(within(quantity()).getByRole('button', { name: 'Increase quantity' }))
    expect(quantity()).toHaveTextContent('2')
    expect(screen.getByText('Free shipping unlocked.')).toBeInTheDocument()
    expect(row('Subtotal')).toHaveTextContent('€90.00')
    expect(screen.getByRole('progressbar', { name: 'Progress to free shipping' })).toHaveAttribute('aria-valuenow', '100')
  })

  it('removes the line when minus is pressed on a single piece', () => {
    openWith([item()])
    fireEvent.click(within(quantity()).getByRole('button', { name: 'Decrease quantity' }))
    expect(useCartStore.getState().items).toEqual([])
    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Shop the drops' })).toHaveAttribute('href', '/shop')
  })

  it('stops at 100 pieces, the checkout limit', () => {
    openWith([item({ quantity: 100 })])
    const plus = within(quantity()).getByRole('button', { name: 'Increase quantity' })
    expect(plus).toBeDisabled()
    fireEvent.click(plus)
    expect(useCartStore.getState().items[0].quantity).toBe(100)
  })

  it('removes a line with its remove button', () => {
    openWith([item(), item({ variantId: 'v2', variantName: `${NAME} / L` })])
    fireEvent.click(screen.getAllByRole('button', { name: `Remove ${NAME}` })[0])
    expect(useCartStore.getState().items.map((i) => i.variantId)).toEqual(['v2'])
  })

  it('closes with the close button and with Escape', () => {
    openWith([item()])
    fireEvent.click(screen.getByRole('button', { name: 'Close cart' }))
    expect(useCartStore.getState().isCartOpen).toBe(false)
    act(() => useCartStore.setState({ isCartOpen: true }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(useCartStore.getState().isCartOpen).toBe(false)
  })

  it('keeps set items grouped under the set title', () => {
    openWith([item({ bundleId: 'set-1', bundleTitle: 'Starter set' })])
    expect(screen.getByText('Starter set')).toBeInTheDocument()
  })
})

describe('sizeFromVariantName', () => {
  it('takes the last part after " / ", or nothing', () => {
    expect(sizeFromVariantName(`${NAME} / M`)).toBe('M')
    expect(sizeFromVariantName('Olympian Tee / Ocean / XL')).toBe('XL')
    expect(sizeFromVariantName('Olympian Backpack')).toBeNull()
  })
})
