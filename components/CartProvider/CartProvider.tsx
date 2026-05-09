'use client'

import { useState } from 'react'
import Nav from '@/components/Nav/Nav'
import CartDrawer from '@/components/CartDrawer/CartDrawer'
import StoreHydration from '@/components/StoreHydration/StoreHydration'

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false)

  return (
    <>
      <StoreHydration />
      <Nav onCartOpen={() => setCartOpen(true)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <div style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </>
  )
}
