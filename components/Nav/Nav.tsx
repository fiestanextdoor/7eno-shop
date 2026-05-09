'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LogoWordmark } from '@/components/Logo/Logo'
import { useCartStore } from '@/store/cart'
import styles from './Nav.module.css'

export default function Nav() {
  const [mounted, setMounted] = useState(false)
  const itemCount = useCartStore((s) => s.itemCount())
  const openCart = useCartStore((s) => s.openCart)

  useEffect(() => { setMounted(true) }, [])

  return (
    <>
      <Link href="/" aria-label="7ENO home" className={styles.logoBox}>
        <LogoWordmark variant="wit" height={28} priority />
        <span className={styles.sub}>by ultra entertainment</span>
      </Link>

      <div className={styles.actions}>
        <button className={styles.cartBtn} onClick={openCart} aria-label="Open cart">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          {mounted && itemCount > 0 && (
            <span className={styles.cartCount}>{itemCount}</span>
          )}
        </button>
      </div>
    </>
  )
}
