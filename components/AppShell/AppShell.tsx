'use client'

import { useState, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import CartDrawer from '@/components/CartDrawer/CartDrawer'
import CheckoutHeader from '@/components/CheckoutHeader/CheckoutHeader'
import StoreHydration from '@/components/StoreHydration/StoreHydration'
import CookieBanner from '@/components/CookieBanner/CookieBanner'
import AnnouncementBar from '@/components/ui/AnnouncementBar/AnnouncementBar'
import SiteHeader from '@/components/ui/SiteHeader/SiteHeader'
import MobileNav from '@/components/ui/MobileNav/MobileNav'
import SiteFooter from '@/components/ui/SiteFooter/SiteFooter'
import { ANNOUNCEMENTS, MAIN_NAV } from '@/lib/nav'
import { useCartStore } from '@/store/cart'
import styles from './AppShell.module.css'

const HIDE_FOOTER = ['/account/login', '/account/register']

const noSubscribe = () => () => {}

/**
 * False on the server and during hydration, true afterwards. The cart store is
 * persisted in localStorage, so its count is only shown once mounted; this
 * keeps the server HTML and the first client render identical.
 */
function useMounted(): boolean {
  return useSyncExternalStore(noSubscribe, () => true, () => false)
}

/**
 * Route chrome around every page: which header, drawer and footer a route
 * gets. It provides no context; the cart lives in the Zustand store.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // The menu belongs to the path it was opened on, so any route change (link,
  // back or forward) closes it without a state update in an effect.
  const [menuOpenAt, setMenuOpenAt] = useState<string | null>(null)
  const menuOpen = menuOpenAt === pathname
  const mounted = useMounted()
  const storeCount = useCartStore((s) => s.itemCount())
  const cartCount = mounted ? storeCount : 0
  const openCart = useCartStore((s) => s.openCart)
  const showFooter = !HIDE_FOOTER.some((p) => pathname.startsWith(p))

  // The coming-soon teaser is a sealed full-screen page (removed in Task 9).
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
      <a href="#main" className={styles.skipLink}>Skip to content</a>
      <div className={styles.chrome}>
        <AnnouncementBar messages={ANNOUNCEMENTS} />
        <SiteHeader
          nav={MAIN_NAV}
          cartCount={cartCount}
          currentPath={pathname}
          menuOpen={menuOpen}
          onMenuOpen={() => setMenuOpenAt(pathname)}
          onCartOpen={openCart}
        />
      </div>
      <MobileNav nav={MAIN_NAV} open={menuOpen} onClose={() => setMenuOpenAt(null)} currentPath={pathname} />
      <CartDrawer />
      <div className={styles.page}>
        <div id="main" className={styles.content}>
          {children}
        </div>
        {showFooter && <SiteFooter nav={MAIN_NAV} />}
      </div>
    </>
  )
}
