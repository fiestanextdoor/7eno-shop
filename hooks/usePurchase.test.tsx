import { act, renderHook } from '@testing-library/react'
import { useCartStore } from '@/store/cart'
import type { NormalizedVariant } from '@/types/catalog'
import { ADDED_MS, sizeLabel, usePurchase, type UsePurchaseOptions } from './usePurchase'

function variant(id: string, color: string, size: string, inStock = true, priceCents = 4500): NormalizedVariant {
  return {
    provider: 'printful', productId: 'p1', id, name: `${size} / ${color}`, size, color,
    colorCode: color === 'Black' ? '#111111' : '#7b1f2b', priceCents, currency: 'EUR',
    inStock, imageUrl: null,
  }
}

const twoColours = [
  variant('b-m', 'Black', 'M'),
  variant('b-l', 'Black', 'L', false),
  variant('b-4xl', 'Black', '4XL'),
  variant('r-m', 'Maroon', 'M'),
  variant('r-l', 'Maroon', 'L'),
]

function setup(overrides: Partial<UsePurchaseOptions> = {}) {
  const options: UsePurchaseOptions = {
    provider: 'printful',
    productId: 'p1',
    productName: 'Olympian Tee',
    variants: twoColours,
    soldOut: false,
    imageFor: (colour) => `/img/${colour || 'base'}.png`,
    ...overrides,
  }
  return renderHook(() => usePurchase(options))
}

const cartIds = () => useCartStore.getState().items.map((i) => i.variantId)

beforeEach(() => {
  useCartStore.setState({ items: [], isCartOpen: false })
  window.history.replaceState({}, '', '/shop/olympian-tee')
})

describe('usePurchase', () => {
  it('asks for a size first, then adds the chosen size of the first colour', () => {
    const { result } = setup()
    expect(result.current.needsSize).toBe(true)
    act(() => result.current.addToCart())
    expect(cartIds()).toEqual([])
    act(() => result.current.selectSize('b-m'))
    expect(result.current.needsSize).toBe(false)
    act(() => result.current.addToCart())
    expect(useCartStore.getState().items).toEqual([
      {
        provider: 'printful', variantId: 'b-m', productId: 'p1', productName: 'Olympian Tee',
        variantName: 'M / Black', price: '45.00', currency: 'EUR', quantity: 1, imageUrl: '/img/Black.png',
      },
    ])
    expect(result.current.added).toBe(true)
  })

  it('never offers hidden sizes; a sold-out size is offered, selectable and not buyable', () => {
    const { result } = setup()
    expect(result.current.sizes).toEqual([
      { value: 'b-m', label: 'M', soldOut: false },
      { value: 'b-l', label: 'L', soldOut: true },
    ])
    act(() => result.current.selectSize('b-l'))
    expect(result.current.selectedSize).toBe('b-l')
    expect(result.current.selectionSoldOut).toBe(true)
    act(() => result.current.addToCart())
    expect(cartIds()).toEqual([])
  })

  it('clears the chosen size when another colour is picked', () => {
    const { result } = setup()
    expect(result.current.colours.map((c) => c.label)).toEqual(['Black', 'Maroon'])
    act(() => result.current.selectSize('b-m'))
    act(() => result.current.selectColour('Maroon'))
    expect(result.current.selectedSize).toBeNull()
    expect(result.current.needsSize).toBe(true)
    act(() => result.current.selectSize('r-l'))
    act(() => result.current.addToCart())
    expect(cartIds()).toEqual(['r-l'])
  })

  it('preselects the colour from a ?color= deep link', () => {
    window.history.replaceState({}, '', '/shop/olympian-tee?color=Maroon')
    const { result } = setup()
    expect(result.current.selectedColour).toBe('Maroon')
  })

  it('auto-selects the only variant of a one-size product', () => {
    const { result } = setup({ variants: [variant('cap', '', 'One size')] })
    expect(result.current.colours).toEqual([])
    expect(result.current.needsSize).toBe(false)
    expect(result.current.selectedSize).toBe('cap')
    act(() => result.current.addToCart())
    expect(cartIds()).toEqual(['cap'])
  })

  it('can only be waitlisted without variants or with hidden sizes only', () => {
    for (const variants of [[], [variant('x', 'Black', '4XL')]]) {
      const { result } = setup({ variants })
      expect(result.current.sizes).toEqual([])
      expect(result.current.needsSize).toBe(false)
      expect(result.current.selectionSoldOut).toBe(true)
      act(() => result.current.addToCart())
      expect(cartIds()).toEqual([])
    }
  })

  it('treats a sold-out product as sold out even where the pre-sale rule would sell it', () => {
    const allOut = [variant('m', 'Black', 'M', false), variant('l', 'Black', 'L', false)]
    const { result } = setup({ variants: allOut, soldOut: true })
    expect(result.current.sizes.every((s) => s.soldOut)).toBe(true)
    expect(result.current.selectionSoldOut).toBe(true)
    act(() => result.current.selectSize('m'))
    act(() => result.current.addToCart())
    expect(cartIds()).toEqual([])
  })

  it('shows the price of the chosen size', () => {
    const { result } = setup({ variants: [variant('m', '', 'M', true, 4500), variant('xl', '', 'XL', true, 5000)] })
    expect(result.current.price).toBe('€45.00')
    act(() => result.current.selectSize('xl'))
    expect(result.current.price).toBe('€50.00')
  })

  it('says Added to cart for a moment', () => {
    jest.useFakeTimers()
    try {
      const { result } = setup({ variants: [variant('cap', '', 'One size')] })
      act(() => result.current.addToCart())
      expect(result.current.added).toBe(true)
      act(() => {
        jest.advanceTimersByTime(ADDED_MS)
      })
      expect(result.current.added).toBe(false)
    } finally {
      jest.useRealTimers()
    }
  })
})

describe('sizeLabel', () => {
  it('uses the EU size when there is one, else capitalises the size or name', () => {
    expect(sizeLabel({ size: '42', name: '' }, { '42': 'EU 42' })).toBe('EU 42')
    expect(sizeLabel({ size: 'xl', name: '' })).toBe('Xl')
    expect(sizeLabel({ size: '', name: 'one size' })).toBe('One Size')
  })
})
