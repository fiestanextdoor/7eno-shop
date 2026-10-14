import { fireEvent, render, screen, within } from '@testing-library/react'
import { DROPS, toDropView } from '@/lib/drops'
import { useCartStore } from '@/store/cart'
import type { NormalizedVariant } from '@/types/catalog'
import ProductView, { type ProductViewProps } from './ProductView'

const [, sport] = DROPS
const NAME = 'OLYMPN Sport Oversized Hoodie Mocha'

function variant(id: string, size: string): NormalizedVariant {
  return {
    provider: 'printful', productId: 'p1', id, name: `${NAME} / ${size}`, size, color: 'Mocha',
    colorCode: '#9E7551', priceCents: 6495, currency: 'EUR', inStock: true, imageUrl: null,
  }
}

function props(overrides: Partial<ProductViewProps['product']> = {}): ProductViewProps {
  return {
    product: {
      provider: 'printful', id: 'p1', name: NAME, slug: 'olympn-sport-oversized-hoodie-mocha',
      purchasable: true, soldOut: false, ...overrides,
    },
    drop: toDropView(sport, Date.parse('2026-11-02T10:00:00Z')),
    variants: [variant('s', 'S'), variant('m', 'M')],
    galleries: {
      Mocha: [
        { src: '/drops/olympn-sport/mocha.webp', alt: `${NAME}, front` },
        { src: '/drops/olympn-sport/dune.webp', alt: `${NAME}, back` },
      ],
    },
    siblings: [],
    euSizeMap: {},
    sizeGuide: null,
    info: [{ title: 'Details', lines: ['Heavyweight cotton'] }],
  }
}

beforeEach(() => {
  useCartStore.setState({ items: [], isCartOpen: false })
  window.history.replaceState({}, '', '/shop/olympn-sport-oversized-hoodie-mocha')
})

describe('ProductView', () => {
  it('keeps gallery, buy panel and the sticky bar in one block, the bar last', () => {
    const { container } = render(<ProductView {...props()} />)
    const root = container.querySelector('[data-pdp]') as HTMLElement
    expect(root).not.toBeNull()
    expect(within(root).getByRole('heading', { level: 1, name: NAME })).toBeInTheDocument()
    expect(within(root).getAllByRole('img', { name: new RegExp(NAME) })).toHaveLength(2)
    expect(root.lastElementChild).toHaveAttribute('data-sticky-buy')
  })

  it('lets the sticky bar and the panel share one selection', () => {
    const { container } = render(<ProductView {...props()} />)
    const bar = container.querySelector('[data-sticky-buy]') as HTMLElement
    expect(within(bar).getByRole('button', { name: 'Select a size' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: 'M' }))
    fireEvent.click(within(bar).getByRole('button', { name: 'Add to cart' }))
    expect(useCartStore.getState().items).toMatchObject([{ variantId: 'm', imageUrl: '/drops/olympn-sport/mocha.webp' }])
  })

  it('has no sticky bar for a teaser', () => {
    const { container } = render(
      <ProductView {...props({ purchasable: false, releaseLabel: '1 November 2026 at 12:00 CET' })} />
    )
    expect(container.querySelector('[data-sticky-buy]')).toBeNull()
  })
})
