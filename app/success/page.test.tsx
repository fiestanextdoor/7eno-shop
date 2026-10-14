import { render, screen } from '@testing-library/react'
import { useSearchParams } from 'next/navigation'
import { useCartStore } from '@/store/cart'
import type { CartItem } from '@/types/cart'
import SuccessPage from './page'

jest.mock('next/navigation', () => ({ useSearchParams: jest.fn() }))

const ITEM: CartItem = {
  provider: 'printful', variantId: 'v1', productId: 'p1', productName: 'Olympian Tee Ocean Unisex',
  variantName: 'Olympian Tee Ocean Unisex / M', price: '45.00', currency: 'EUR', quantity: 1, imageUrl: null,
}

function at(query: string) {
  jest.mocked(useSearchParams).mockReturnValue(new URLSearchParams(query) as unknown as ReturnType<typeof useSearchParams>)
}

beforeEach(() => {
  useCartStore.setState({ items: [ITEM], isCartOpen: false })
})

describe('success page', () => {
  it('confirms the order, shows the reference and empties the cart', () => {
    at('session_id=cs_test_a1b2c3d4e5f6g7h8i9j0')
    render(<SuccessPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Thank you' })).toBeInTheDocument()
    expect(screen.getByText('Order confirmed')).toBeInTheDocument()
    expect(screen.getByText('e5f6g7h8i9j0')).toBeInTheDocument()
    expect(useCartStore.getState().items).toEqual([])
  })

  it('leaves out the reference without a session id', () => {
    at('')
    render(<SuccessPage />)
    expect(screen.queryByText('Order ref')).toBeNull()
  })

  it('leads back to the shop and to the orders', () => {
    at('')
    render(<SuccessPage />)
    expect(screen.getByRole('link', { name: 'Continue shopping' })).toHaveAttribute('href', '/shop')
    expect(screen.getByRole('link', { name: 'View your orders' })).toHaveAttribute('href', '/account/orders')
  })
})
