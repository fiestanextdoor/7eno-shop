import { createElement } from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot } from 'react-dom/client'
import { usePathname } from 'next/navigation'
import { useCartStore } from '@/store/cart'
import AppShell from './AppShell'

// Hoisted function declarations so the jest.mock factories below can use them.
// jest.mock takes relative paths: SWC rewrites '@/' in imports only.
function mockChrome(testId: string, extra: Record<string, string> = {}) {
  return createElement('div', { 'data-testid': testId, ...extra })
}

interface HeaderMockProps {
  cartCount: number
  currentPath: string
  onMenuOpen(): void
  onCartOpen(): void
}

// Every cartCount the header receives, in render order (hydration test).
const mockHeaderCounts: number[] = []

function mockHeader(p: HeaderMockProps) {
  mockHeaderCounts.push(p.cartCount)
  return createElement(
    'div',
    { 'data-testid': 'site-header', 'data-count': String(p.cartCount), 'data-path': p.currentPath },
    createElement('button', { type: 'button', onClick: p.onMenuOpen }, 'menu'),
    createElement('button', { type: 'button', onClick: p.onCartOpen }, 'cart')
  )
}

jest.mock('next/navigation', () => ({ usePathname: jest.fn() }))
jest.mock('../ui/AnnouncementBar/AnnouncementBar', () => ({ __esModule: true, default: () => mockChrome('announcement-bar') }))
jest.mock('../ui/SiteHeader/SiteHeader', () => ({ __esModule: true, default: (p: HeaderMockProps) => mockHeader(p) }))
jest.mock('../ui/MobileNav/MobileNav', () => ({
  __esModule: true,
  default: (p: { open: boolean }) => mockChrome('mobile-nav', { 'data-open': String(p.open) }),
}))
jest.mock('../ui/SiteFooter/SiteFooter', () => ({ __esModule: true, default: () => mockChrome('footer') }))
jest.mock('../CartDrawer/CartDrawer', () => ({ __esModule: true, default: () => mockChrome('cart-drawer') }))
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

const TWO_LINES = [
  { provider: 'printful' as const, variantId: 'v1', productId: 'p1', productName: 'Olympian Tee Sand Unisex', variantName: 'M', price: '45.00', currency: 'EUR', quantity: 2, imageUrl: null },
  { provider: 'printful' as const, variantId: 'v2', productId: 'p2', productName: 'Olympian Tee Ocean Unisex', variantName: 'L', price: '45.00', currency: 'EUR', quantity: 1, imageUrl: null },
]

beforeEach(() => {
  useCartStore.setState({ items: [], isCartOpen: false })
  mockHeaderCounts.length = 0
})

describe('AppShell route chrome', () => {
  it.each(['/', '/shop', '/shop/olympian-tee-sand-unisex', '/account', '/collections/olympn-sport'])(
    'renders the full v2 chrome on %s',
    (path) => {
      renderAt(path)
      for (const id of ['store-hydration', 'cookie-banner', 'announcement-bar', 'site-header', 'mobile-nav', 'cart-drawer', 'footer']) {
        expect(present(id)).toBe(true)
      }
      expect(present('checkout-header')).toBe(false)
      expect(screen.getByTestId('site-header')).toHaveAttribute('data-path', path)
    }
  )

  it('puts the page in #main with a skip link to it', () => {
    renderAt('/shop')
    expect(screen.getByText('page content').parentElement).toHaveAttribute('id', 'main')
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main')
  })

  it.each(['/account/login', '/account/register'])('hides only the footer on %s', (path) => {
    renderAt(path)
    expect(present('site-header')).toBe(true)
    expect(present('footer')).toBe(false)
  })

  it('seals /checkout: hydration and checkout header only', () => {
    renderAt('/checkout')
    expect(present('store-hydration')).toBe(true)
    expect(present('checkout-header')).toBe(true)
    for (const id of ['announcement-bar', 'site-header', 'mobile-nav', 'cart-drawer', 'footer', 'cookie-banner']) {
      expect(present(id)).toBe(false)
    }
    expect(screen.getByText('page content')).toBeInTheDocument()
  })

  it('passes the cart item count to the header', () => {
    useCartStore.setState({
      items: [
        { provider: 'printful', variantId: 'v1', productId: 'p1', productName: 'Olympian Tee Sand Unisex', variantName: 'M', price: '45.00', currency: 'EUR', quantity: 2, imageUrl: null },
        { provider: 'printful', variantId: 'v2', productId: 'p2', productName: 'Olympian Tee Ocean Unisex', variantName: 'L', price: '45.00', currency: 'EUR', quantity: 1, imageUrl: null },
      ],
    })
    renderAt('/shop')
    expect(screen.getByTestId('site-header')).toHaveAttribute('data-count', '3')
  })

  it('opens the mobile menu from the header', () => {
    renderAt('/')
    expect(screen.getByTestId('mobile-nav')).toHaveAttribute('data-open', 'false')
    fireEvent.click(screen.getByRole('button', { name: 'menu' }))
    expect(screen.getByTestId('mobile-nav')).toHaveAttribute('data-open', 'true')
  })

  it('opens the cart drawer from the header', () => {
    renderAt('/')
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'cart' }))
    })
    expect(useCartStore.getState().isCartOpen).toBe(true)
  })

  it('closes the mobile menu when the route changes (back/forward)', () => {
    jest.mocked(usePathname).mockReturnValue('/shop')
    const { rerender } = render(<AppShell><p>page content</p></AppShell>)
    fireEvent.click(screen.getByRole('button', { name: 'menu' }))
    expect(screen.getByTestId('mobile-nav')).toHaveAttribute('data-open', 'true')
    jest.mocked(usePathname).mockReturnValue('/about')
    rerender(<AppShell><p>page content</p></AppShell>)
    expect(screen.getByTestId('mobile-nav')).toHaveAttribute('data-open', 'false')
    jest.mocked(usePathname).mockReturnValue('/shop')
    rerender(<AppShell><p>page content</p></AppShell>)
    expect(screen.getByTestId('mobile-nav')).toHaveAttribute('data-open', 'false')
  })
})

describe('AppShell cart count hydration', () => {
  it('renders no count on the server and the first client render, then the store count', () => {
    useCartStore.setState({ items: TWO_LINES })
    jest.mocked(usePathname).mockReturnValue('/shop')
    const tree = <AppShell><p>page content</p></AppShell>
    const container = document.createElement('div')
    container.innerHTML = renderToString(tree)
    expect(container.querySelector('[data-testid="site-header"]')).toHaveAttribute('data-count', '0')

    mockHeaderCounts.length = 0
    document.body.appendChild(container)
    let root: ReturnType<typeof hydrateRoot> | undefined
    act(() => {
      root = hydrateRoot(container, tree)
    })
    expect(mockHeaderCounts[0]).toBe(0)
    expect(container.querySelector('[data-testid="site-header"]')).toHaveAttribute('data-count', '3')
    act(() => root?.unmount())
    container.remove()
  })
})
