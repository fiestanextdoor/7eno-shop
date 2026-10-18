import { fireEvent, render, screen } from '@testing-library/react'
import { usePurchase } from '@/hooks/usePurchase'
import { DROPS, toDropView } from '@/lib/drops'
import type { InfoSection } from '@/lib/product-copy'
import { useCartStore } from '@/store/cart'
import type { NormalizedVariant } from '@/types/catalog'
import BuyPanel, { type BuyPanelProduct, type BuyPanelSizeGuide } from './BuyPanel'

const [, sport] = DROPS
const DROP = toDropView(sport, Date.parse('2026-11-02T10:00:00Z'))
const INFO: InfoSection[] = [
  { title: 'Details', lines: ['Heavyweight cotton'] },
  { title: 'Fit', lines: ['Oversized fit'] },
  { title: 'Shipping and returns', lines: ['Returns within 14 days'] },
]
const GUIDE: BuyPanelSizeGuide = {
  category: 'Hoodies',
  guide: { unit: 'cm', sizes: ['S', 'M'], rows: [{ label: 'Chest', values: { S: '104', M: '110' } }] },
}
const NAME = 'OLYMPN Sport Oversized Hoodie Mocha'

function variant(id: string, size: string, inStock = true): NormalizedVariant {
  return {
    provider: 'printful', productId: 'p1', id, name: `${NAME} / ${size}`, size, color: 'Mocha',
    colorCode: '#9E7551', priceCents: 6495, currency: 'EUR', inStock, imageUrl: null,
  }
}

const SIZES = [variant('s', 'S'), variant('m', 'M'), variant('l', 'L', false)]

function Harness({
  product = {},
  variants = SIZES,
  sizeGuide = GUIDE,
}: {
  product?: Partial<BuyPanelProduct>
  variants?: NormalizedVariant[]
  sizeGuide?: BuyPanelSizeGuide | null
}) {
  const full: BuyPanelProduct = {
    name: NAME,
    slug: 'olympn-sport-oversized-hoodie-mocha',
    purchasable: true,
    soldOut: false,
    ...product,
  }
  const purchase = usePurchase({
    provider: 'printful',
    productId: 'p1',
    productName: full.name,
    variants,
    soldOut: full.soldOut,
    imageFor: () => '/drops/olympn-sport/mocha.webp',
  })
  return (
    <BuyPanel
      product={full}
      drop={DROP}
      siblings={[]}
      purchase={purchase}
      sizeGuide={sizeGuide}
      modelNote="Model is 1,85 m and wears L"
      info={INFO}
      anchors={{ sizes: 'sizes', notify: 'notify' }}
    />
  )
}

beforeEach(() => {
  useCartStore.setState({ items: [], isCartOpen: false })
  window.history.replaceState({}, '', '/shop/olympn-sport-oversized-hoodie-mocha')
})

describe('BuyPanel', () => {
  it('shows the edition, the name, the price and the accordions', () => {
    render(<Harness />)
    expect(screen.getByRole('link', { name: 'Edition 02 · OLYMPN Sport' })).toHaveAttribute('href', '/collections/olympn-sport')
    expect(screen.getByRole('heading', { level: 1, name: NAME })).toBeInTheDocument()
    expect(screen.getByText('€64.95')).toBeInTheDocument()
    for (const title of ['Details', 'Fit', 'Shipping and returns']) {
      expect(screen.getAllByText(title).some((el) => el.closest('summary'))).toBe(true)
    }
  })

  it('adds the chosen size to the cart store', () => {
    render(<Harness />)
    expect(screen.getByRole('button', { name: 'Select a size' })).toBeDisabled()
    fireEvent.click(screen.getByRole('radio', { name: 'M' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }))
    expect(useCartStore.getState().items).toMatchObject([
      { variantId: 'm', productName: NAME, price: '64.95', quantity: 1, imageUrl: '/drops/olympn-sport/mocha.webp' },
    ])
    expect(screen.getByRole('button', { name: 'Added to cart' })).toBeInTheDocument()
  })

  it('turns the button into Notify me for a sold-out size', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('radio', { name: 'L (sold out)' }))
    expect(screen.queryByRole('button', { name: /Add to cart|Select a size/ })).toBeNull()
    expect(screen.getByText('This size is sold out.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email me when it is back')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Notify me' })).toBeInTheDocument()
    expect(useCartStore.getState().items).toEqual([])
  })

  it('shows Sold out and Notify me straight away for a sold-out product', () => {
    render(<Harness product={{ soldOut: true }} variants={[variant('s', 'S', false), variant('m', 'M', false)]} />)
    expect(screen.getByText('Sold out')).toBeInTheDocument()
    expect(screen.getByText('Sold out.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Notify me' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio').every((r) => r.getAttribute('data-sold-out') === 'true')).toBe(true)
  })

  it('offers a waitlist instead of sizes and add-to-cart before the release', () => {
    render(<Harness product={{ purchasable: false, releaseLabel: '1 November 2026 at 12:00 CET' }} />)
    expect(screen.queryByRole('button', { name: /Add to cart|Select a size/ })).toBeNull()
    expect(screen.queryByRole('radiogroup')).toBeNull()
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
    expect(screen.getByText('Drops 1 November 2026 at 12:00 CET')).toBeInTheDocument()
    expect(screen.getByLabelText('Get notified when it drops')).toBeInTheDocument()
  })

  it('skips the size picker for a one-size product and adds straight away', () => {
    render(<Harness variants={[variant('one', 'One size')]} />)
    expect(screen.queryByRole('radiogroup', { name: 'Size' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Size guide' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }))
    expect(useCartStore.getState().items.map((i) => i.variantId)).toEqual(['one'])
  })

  it('can only be waitlisted when there are no variants', () => {
    render(<Harness variants={[]} sizeGuide={null} />)
    expect(screen.queryByText(/€/)).toBeNull()
    expect(screen.queryByRole('button', { name: /Add to cart|Select a size/ })).toBeNull()
    expect(screen.getByRole('button', { name: 'Notify me' })).toBeInTheDocument()
  })

  it('shows a Fit row with the cut from the name and the model note, also before the release', () => {
    const { unmount } = render(<Harness />)
    const fit = screen.getByTestId('fit')
    expect(fit).toHaveTextContent('Oversized fit: roomy through the body and sleeves.')
    expect(fit).toHaveTextContent('Model is 1,85 m and wears L')
    unmount()
    render(<Harness product={{ purchasable: false, releaseLabel: '1 November 2026 at 12:00 CET' }} />)
    expect(screen.getByTestId('fit')).toHaveTextContent('Model is 1,85 m and wears L')
  })

  it('tells how far the cart is from free shipping once a piece is added', () => {
    render(<Harness />)
    expect(screen.queryByText(/free shipping/)).toBeNull()
    fireEvent.click(screen.getByRole('radio', { name: 'M' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }))
    expect(screen.getByText('€10.05 away from free shipping.')).toBeInTheDocument()
  })

  it('opens the size guide from the size row and shows the model note', () => {
    render(<Harness />)
    expect(screen.getAllByText('Model is 1,85 m and wears L').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: 'Size guide' }))
    expect(screen.getByRole('dialog', { name: 'Hoodies size guide' })).toBeInTheDocument()
  })
})
