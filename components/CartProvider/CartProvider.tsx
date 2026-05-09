'use client'

import Nav from '@/components/Nav/Nav'
import CartDrawer from '@/components/CartDrawer/CartDrawer'
import Footer from '@/components/Footer/Footer'
import StoreHydration from '@/components/StoreHydration/StoreHydration'

export default function CartProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StoreHydration />
      <Nav />
      <CartDrawer />
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }}>
          {children}
        </div>
        <Footer />
      </div>
    </>
  )
}
