'use client'

import { usePathname } from 'next/navigation'
import Nav from '@/components/Nav/Nav'
import CartDrawer from '@/components/CartDrawer/CartDrawer'
import Footer from '@/components/Footer/Footer'
import StoreHydration from '@/components/StoreHydration/StoreHydration'
import CookieBanner from '@/components/CookieBanner/CookieBanner'

const HIDE_FOOTER = ['/account/login', '/account/register']

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showFooter = !HIDE_FOOTER.some((p) => pathname.startsWith(p))

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
