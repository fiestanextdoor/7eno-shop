import { render, screen, fireEvent } from '@testing-library/react'
import ProductDetail from './ProductDetail'
import { useCartStore } from '@/store/cart'
import type { NormalizedVariant } from '@/types/catalog'

function variant(id: string, color: string, size: string, inStock = true): NormalizedVariant {
  return {
    provider: 'printful', productId: 'p1', id, name: `${size} / ${color}`, size, color,
    colorCode: color === 'Black' ? '#111111' : '#7b1f2b', priceCents: 4500, currency: 'EUR',
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

function renderPdp(variants: NormalizedVariant[]) {
  return render(
    <ProductDetail provider="printful" productId="p1" productName="Olympian Tee" variants={variants} />
  )
}

beforeEach(() => {
  useCartStore.setState({ items: [], isCartOpen: false })
  window.history.replaceState({}, '', '/shop/olympian-tee')
})

describe('ProductDetail variant picking', () => {
  it('asks for a size first, then adds the chosen size of the first colour', () => {
    renderPdp(twoColours)
    const cta = screen.getByRole('button', { name: 'Select a size' })
    expect(cta).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'M' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }))
    expect(useCartStore.getState().items.map((i) => i.variantId)).toEqual(['b-m'])
  })

  it('never offers hidden sizes and disables sold-out sizes', () => {
    renderPdp(twoColours)
    expect(screen.queryByRole('button', { name: '4XL' })).toBeNull()
    expect(screen.getByRole('button', { name: 'L' })).toBeDisabled()
  })

  it('clears the chosen size when another colour is picked', () => {
    const { container } = renderPdp(twoColours)
    fireEvent.click(screen.getByRole('button', { name: 'M' }))
    const swatches = container.querySelectorAll('button.colorSwatch')
    expect(swatches).toHaveLength(2)
    fireEvent.click(swatches[1])
    expect(screen.getByRole('button', { name: 'Select a size' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'L' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }))
    expect(useCartStore.getState().items.map((i) => i.variantId)).toEqual(['r-l'])
  })

  it('preselects the colour from a ?color= deep link', () => {
    window.history.replaceState({}, '', '/shop/olympian-tee?color=Maroon')
    renderPdp(twoColours)
    fireEvent.click(screen.getByRole('button', { name: 'M' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }))
    expect(useCartStore.getState().items.map((i) => i.variantId)).toEqual(['r-m'])
  })

  it('auto-selects the only variant of a one-size product', () => {
    renderPdp([variant('cap', '', 'One size')])
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }))
    expect(useCartStore.getState().items.map((i) => i.variantId)).toEqual(['cap'])
  })
})

describe('ProductDetail teaser', () => {
  it('offers a waitlist instead of sizes and add-to-cart before the release', () => {
    render(
      <ProductDetail
        provider="printful"
        productId="p1"
        productName="OLYMPN Sport Oversized Hoodie Mocha"
        variants={twoColours}
        purchasable={false}
        releaseLabel="1 November 2026 at 12:00 CET"
      />
    )
    expect(screen.queryByRole('button', { name: /Add to cart|Select a size/ })).toBeNull()
    expect(screen.queryByRole('button', { name: 'M' })).toBeNull()
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
    expect(screen.getByText('Drops 1 November 2026 at 12:00 CET')).toBeInTheDocument()
    expect(screen.getByLabelText('Get notified when it drops')).toBeInTheDocument()
  })
})
