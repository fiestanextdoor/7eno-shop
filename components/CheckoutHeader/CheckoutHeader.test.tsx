import { fireEvent, render, screen } from '@testing-library/react'
import { createElement, type MouseEvent, type ReactNode } from 'react'
import { useCartStore } from '@/store/cart'
import CheckoutHeader from './CheckoutHeader'

interface MockLinkProps {
  href: string
  children: ReactNode
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
  className?: string
}

function mockLink({ href, children, onClick, className }: MockLinkProps) {
  return createElement(
    'a',
    {
      href,
      className,
      onClick: (event: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event)
        event.preventDefault()
      },
    },
    children
  )
}

jest.mock('next/link', () => ({ __esModule: true, default: (p: MockLinkProps) => mockLink(p) }))

describe('CheckoutHeader', () => {
  it('takes the shopper back to the shop with the cart open', () => {
    useCartStore.setState({ items: [], isCartOpen: false })
    render(<CheckoutHeader />)
    const back = screen.getByRole('link', { name: 'Back to cart' })
    expect(back).toHaveAttribute('href', '/shop')
    fireEvent.click(back)
    expect(useCartStore.getState().isCartOpen).toBe(true)
  })

  it('shows the 7ENO wordmark', () => {
    render(<CheckoutHeader />)
    expect(screen.getByRole('banner')).toContainElement(screen.getByRole('img', { name: /7ENO/i }))
  })
})
