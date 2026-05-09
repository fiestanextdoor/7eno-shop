import { useCartStore } from './cart'
import type { CartItem } from '@/types/cart'

const mockItem: CartItem = {
  variantId: 1,
  productId: 10,
  productName: 'Zeus Hoodie',
  variantName: 'M / Black',
  price: '49.99',
  currency: 'EUR',
  quantity: 1,
  imageUrl: 'https://example.com/img.jpg',
}

beforeEach(() => {
  useCartStore.setState({ items: [] })
})

describe('cart store', () => {
  it('adds an item', () => {
    useCartStore.getState().addItem(mockItem)
    expect(useCartStore.getState().items).toHaveLength(1)
  })

  it('increases quantity when same variant added', () => {
    useCartStore.getState().addItem(mockItem)
    useCartStore.getState().addItem(mockItem)
    const items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(2)
  })

  it('removes an item by variantId', () => {
    useCartStore.getState().addItem(mockItem)
    useCartStore.getState().removeItem(1)
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('clears all items', () => {
    useCartStore.getState().addItem(mockItem)
    useCartStore.getState().clearCart()
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('calculates total correctly', () => {
    useCartStore.getState().addItem({ ...mockItem, quantity: 2 })
    const total = useCartStore.getState().total()
    expect(total).toBeCloseTo(99.98, 2)
  })

  it('opens and closes cart', () => {
    const { openCart, closeCart } = useCartStore.getState()
    expect(useCartStore.getState().isCartOpen).toBe(false)
    openCart()
    expect(useCartStore.getState().isCartOpen).toBe(true)
    closeCart()
    expect(useCartStore.getState().isCartOpen).toBe(false)
  })
})
