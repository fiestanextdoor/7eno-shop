'use client'

import { usePathname } from 'next/navigation'
import Nav from '@/components/Nav/Nav'
import CartDrawer from '@/components/CartDrawer/CartDrawer'
import Footer from '@/components/Footer/Footer'
import CheckoutHeader from '@/components/CheckoutHeader/CheckoutHeader'
import StoreHydration from '@/components/StoreHydration/StoreHydration'
import CookieBanner from '@/components/CookieBanner/CookieBanner'

const HIDE_FOOTER = ['/account/login', '/account/register']

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showFooter = !HIDE_FOOTER.some((p) => pathname.startsWith(p))

  // The coming-soon teaser is a sealed full-screen page: no nav, cart or footer
  // (nothing to navigate to while the shop is locked).
  if (pathname === '/coming-soon') {
    return <>{children}</>
  }

  // Checkout is a sealed step: no nav, cart drawer or footer, only the centred
  // logo, so the customer stays in the flow until the order is placed.
  // StoreHydration stays so the cart the checkout reads is still loaded.
  if (pathname === '/checkout') {
    return (
      <>
        <StoreHydration />
        <CheckoutHeader />
        {children}
      </>
    )
  }

  return (
    <>
      <StoreHydration />
      <CookieBanner />
      <Nav />
      <CartDrawer />
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }}>
          {children}
        </div>
        {showFooter && <Footer />}
      </div>
    </>
  )
}
