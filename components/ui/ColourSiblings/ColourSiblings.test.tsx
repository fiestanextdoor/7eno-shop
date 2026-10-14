import { render, screen } from '@testing-library/react'
import type { ColourSibling } from '@/lib/colour-siblings'
import ColourSiblings from './ColourSiblings'

const ITEMS: ColourSibling[] = [
  { name: 'Rose Red', hex: '#621926', href: '/shop/olympn-sport-oversized-hoodie-rose-red', current: false, soldOut: false },
  { name: 'Pistachio', hex: '#9CAF92', href: '/shop/olympn-sport-oversized-hoodie-pistachio', current: false, soldOut: true },
  { name: 'Mocha', hex: '#9E7551', href: '/shop/olympn-sport-oversized-hoodie-mocha', current: true, soldOut: false },
]

describe('ColourSiblings', () => {
  it('links to the other colours and names the current one', () => {
    render(<ColourSiblings items={ITEMS} />)
    expect(screen.getByText('Colour')).toBeInTheDocument()
    expect(screen.getByText('Mocha')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Rose Red' })).toHaveAttribute('href', '/shop/olympn-sport-oversized-hoodie-rose-red')
    expect(screen.getByRole('img', { name: 'Mocha, selected' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Mocha/ })).toBeNull()
  })

  it('keeps a sold-out colour reachable and says so', () => {
    render(<ColourSiblings items={ITEMS} />)
    const pistachio = screen.getByRole('link', { name: 'Pistachio, sold out' })
    expect(pistachio).toHaveAttribute('data-sold-out', 'true')
    expect(pistachio).toHaveAttribute('href', '/shop/olympn-sport-oversized-hoodie-pistachio')
  })

  it('renders nothing for a single colour', () => {
    const { container } = render(<ColourSiblings items={[ITEMS[2]]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
