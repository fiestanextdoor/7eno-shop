import { createElement } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import SiteHeader from './SiteHeader'
import { MAIN_NAV } from '@/lib/nav'

jest.mock('../../AccountButton/AccountButton', () => ({
  __esModule: true,
  default: () => createElement('a', { href: '/account/login' }, 'Account'),
}))

function renderHeader(overrides: Partial<Parameters<typeof SiteHeader>[0]> = {}) {
  const props = {
    nav: MAIN_NAV,
    cartCount: 0,
    currentPath: '/',
    menuOpen: false,
    onMenuOpen: jest.fn(),
    onCartOpen: jest.fn(),
    ...overrides,
  }
  render(<SiteHeader {...props} />)
  return props
}

describe('SiteHeader', () => {
  it('links every main destination', () => {
    renderHeader()
    const nav = screen.getByRole('navigation', { name: 'Main' })
    for (const item of MAIN_NAV) {
      expect(nav.querySelector(`a[href="${item.href}"]`)).toHaveTextContent(item.label)
    }
  })

  it('marks the current section with aria-current', () => {
    renderHeader({ currentPath: '/collections/olympn-sport' })
    expect(screen.getByRole('link', { name: 'OLYMPN Sport' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Shop' })).not.toHaveAttribute('aria-current')
  })

  it('shows the cart count and announces it in the button name', () => {
    const props = renderHeader({ cartCount: 3 })
    const cart = screen.getByRole('button', { name: 'Open cart, 3 items' })
    expect(cart).toHaveTextContent('3')
    fireEvent.click(cart)
    expect(props.onCartOpen).toHaveBeenCalledTimes(1)
  })

  it('hides the count for an empty cart', () => {
    renderHeader({ cartCount: 0 })
    expect(screen.getByRole('button', { name: 'Open cart' }).querySelector('span')).toBeNull()
  })

  it('uses the singular for one item', () => {
    renderHeader({ cartCount: 1 })
    expect(screen.getByRole('button', { name: 'Open cart, 1 item' })).toBeInTheDocument()
  })

  it('opens the mobile menu and reports its state', () => {
    const props = renderHeader({ menuOpen: false })
    const menu = screen.getByRole('button', { name: 'Open menu' })
    expect(menu).toHaveAttribute('aria-expanded', 'false')
    expect(menu).toHaveAttribute('aria-controls', 'mobile-nav')
    fireEvent.click(menu)
    expect(props.onMenuOpen).toHaveBeenCalledTimes(1)
  })

  it('keeps the account link', () => {
    renderHeader()
    expect(screen.getByRole('link', { name: 'Account' })).toHaveAttribute('href', '/account/login')
  })
})
