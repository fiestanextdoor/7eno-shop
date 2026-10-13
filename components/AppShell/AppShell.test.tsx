import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import AppShell from './AppShell'

// Function declaration (hoisted) so the jest.mock factories below can use it.
// jest.mock takes relative paths: SWC rewrites '@/' in imports only.
function mockChrome(testId: string) {
  return createElement('div', { 'data-testid': testId })
}

jest.mock('next/navigation', () => ({ usePathname: jest.fn() }))
jest.mock('../Nav/Nav', () => ({ __esModule: true, default: () => mockChrome('nav') }))
jest.mock('../CartDrawer/CartDrawer', () => ({ __esModule: true, default: () => mockChrome('cart-drawer') }))
jest.mock('../Footer/Footer', () => ({ __esModule: true, default: () => mockChrome('footer') }))
jest.mock('../CheckoutHeader/CheckoutHeader', () => ({ __esModule: true, default: () => mockChrome('checkout-header') }))
jest.mock('../StoreHydration/StoreHydration', () => ({ __esModule: true, default: () => mockChrome('store-hydration') }))
jest.mock('../CookieBanner/CookieBanner', () => ({ __esModule: true, default: () => mockChrome('cookie-banner') }))

function renderAt(pathname: string) {
  jest.mocked(usePathname).mockReturnValue(pathname)
  return render(
    <AppShell>
      <p>page content</p>
    </AppShell>
  )
}

const present = (testId: string) => screen.queryByTestId(testId) !== null

describe('AppShell route chrome', () => {
  it.each(['/', '/shop', '/shop/olympian-hoodie-teal', '/account', '/deals'])(
    'renders the full store chrome on %s',
    (path) => {
      renderAt(path)
      expect(present('store-hydration')).toBe(true)
      expect(present('cookie-banner')).toBe(true)
      expect(present('nav')).toBe(true)
      expect(present('cart-drawer')).toBe(true)
      expect(present('footer')).toBe(true)
      expect(present('checkout-header')).toBe(false)
      expect(screen.getByText('page content')).toBeInTheDocument()
    }
  )

  it('keeps the sticky-footer layout wrapper around the page', () => {
    renderAt('/shop')
    const outer = screen.getByText('page content').parentElement?.parentElement
    expect(outer).toHaveStyle({ minHeight: '100vh', display: 'flex', flexDirection: 'column' })
  })

  it.each(['/account/login', '/account/register'])('hides only the footer on %s', (path) => {
    renderAt(path)
    expect(present('nav')).toBe(true)
    expect(present('cart-drawer')).toBe(true)
    expect(present('footer')).toBe(false)
  })

  it('seals /checkout: hydration and checkout header only', () => {
    renderAt('/checkout')
    expect(present('store-hydration')).toBe(true)
    expect(present('checkout-header')).toBe(true)
    expect(present('nav')).toBe(false)
    expect(present('cart-drawer')).toBe(false)
    expect(present('footer')).toBe(false)
    expect(present('cookie-banner')).toBe(false)
    expect(screen.getByText('page content')).toBeInTheDocument()
  })

  it('renders /coming-soon bare, without any chrome or hydration', () => {
    renderAt('/coming-soon')
    for (const id of ['store-hydration', 'checkout-header', 'nav', 'cart-drawer', 'footer', 'cookie-banner']) {
      expect(present(id)).toBe(false)
    }
    expect(screen.getByText('page content')).toBeInTheDocument()
  })
})
