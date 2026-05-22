'use client'

import { usePathname } from 'next/navigation'
import Nav from '@/components/Nav/Nav'
import CartDrawer from '@/components/CartDrawer/CartDrawer'
import Footer from '@/components/Footer/Footer'
import StoreHydration from '@/components/StoreHydration/StoreHydration'

const HIDE_CHROME = ['/', '/account/login', '/account/register']

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideChrome = pathname === '/' || HIDE_CHROME.filter((p) => p !== '/').some((p) => pathname.startsWith(p))
  const showNav    = !hideChrome
  const showFooter = !hideChrome

  return (
    <>
      <StoreHydration />
      {showNav && <Nav />}
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
