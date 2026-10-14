import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fireEvent, render, screen } from '@testing-library/react'
import type { Purchase } from '@/hooks/usePurchase'
import StickyBuyBar from './StickyBuyBar'

function purchase(overrides: Partial<Purchase> = {}): Purchase {
  return {
    colours: [],
    selectedColour: '',
    selectColour: jest.fn(),
    sizes: [],
    selectedSize: null,
    selectSize: jest.fn(),
    needsSize: false,
    selectionSoldOut: false,
    price: '€64.95',
    added: false,
    addToCart: jest.fn(),
    ...overrides,
  }
}

const ANCHORS = { sizes: 'sizes', notify: 'notify' }

describe('StickyBuyBar', () => {
  it('shows the name and price and adds to the cart', () => {
    const p = purchase()
    render(<StickyBuyBar name="OLYMPN Sport Oversized Hoodie Mocha" purchase={p} anchors={ANCHORS} />)
    expect(screen.getByText('OLYMPN Sport Oversized Hoodie Mocha')).toBeInTheDocument()
    expect(screen.getByText('€64.95')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }))
    expect(p.addToCart).toHaveBeenCalledTimes(1)
  })

  it('sends Select a size to the size group, on the focusable radio', () => {
    const p = purchase({ needsSize: true })
    render(
      <>
        <div id="sizes" role="radiogroup" aria-label="Size">
          <button type="button" role="radio" aria-checked={false} tabIndex={0}>S</button>
          <button type="button" role="radio" aria-checked={false} tabIndex={-1}>M</button>
        </div>
        <StickyBuyBar name="Hoodie" purchase={p} anchors={ANCHORS} />
      </>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Select a size' }))
    expect(screen.getByRole('radio', { name: 'S' })).toHaveFocus()
    expect(p.addToCart).not.toHaveBeenCalled()
  })

  it('sends Notify me to the email field', () => {
    render(
      <>
        <div id="notify" tabIndex={-1}>
          <label htmlFor="mail">Email</label>
          <input id="mail" type="email" />
        </div>
        <StickyBuyBar name="Hoodie" purchase={purchase({ selectionSoldOut: true })} anchors={ANCHORS} />
      </>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Notify me' }))
    expect(screen.getByLabelText('Email')).toHaveFocus()
  })

  it('says Added to cart after adding', () => {
    render(<StickyBuyBar name="Hoodie" purchase={purchase({ added: true })} anchors={ANCHORS} />)
    expect(screen.getByRole('button', { name: 'Added to cart' })).toBeInTheDocument()
  })

  it('is sticky inside the page, never fixed over the footer, and clears the iOS home bar', () => {
    const css = readFileSync(path.join(process.cwd(), 'components/ui/StickyBuyBar/StickyBuyBar.module.css'), 'utf8')
    const bar = css.slice(css.indexOf('.bar {'), css.indexOf('}', css.indexOf('.bar {')))
    expect(bar).toContain('position: sticky')
    expect(bar).toContain('bottom: 0')
    expect(bar).toContain('env(safe-area-inset-bottom)')
    expect(css).not.toContain('position: fixed')
  })
})
