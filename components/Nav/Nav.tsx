'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LogoWordmark } from '@/components/Logo/Logo'
import ShopDropdown from '@/components/ShopDropdown/ShopDropdown'
import AccountButton from '@/components/AccountButton/AccountButton'
import { useCartStore } from '@/store/cart'
import styles from './Nav.module.css'

export default function Nav() {
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const isHome = pathname === '/'
  // The redesigned surfaces (homepage, shop list and the content landing pages)
  // get the Olympian palette, so the header turns teal there. Every other page
  // — account, checkout, deals, the legal pages — keeps the original red header.
  const THEMED_ROUTES = ['/', '/shop', '/olympian', '/about', '/size-guide', '/faq']
  const themed = THEMED_ROUTES.includes(pathname)
  const itemCount = useCartStore((s) => s.itemCount())
  const openCart = useCartStore((s) => s.openCart)

  useEffect(() => {
    setMounted(true)
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const visible = !isHome || scrolled

  return (
    <nav className={`${styles.nav} ${visible ? styles.navVisible : ''} ${themed ? 'oly-palette' : ''}`} aria-label="Main navigation">
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="7ENO home">
          <LogoWordmark variant="butter" height={88} />
        </Link>

        <div className={styles.center}>
          <ShopDropdown />
        </div>

        <div className={styles.actions}>
          <AccountButton />
          <button
            className={styles.cartBtn}
            onClick={openCart}
            aria-label={`Open cart${mounted && itemCount > 0 ? `, ${itemCount} items` : ''}`}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            {mounted && itemCount > 0 && (
              <span className={styles.cartCount}>{itemCount}</span>
            )}
          </button>
        </div>
      </div>
    </nav>
  )
}
