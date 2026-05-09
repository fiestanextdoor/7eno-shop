'use client'

import Link from 'next/link'
import { useCartStore } from '@/store/cart'
import Logo from '@/components/Logo/Logo'
import styles from './Nav.module.css'

interface NavProps {
  onCartOpen: () => void
}

export default function Nav({ onCartOpen }: NavProps) {
  const itemCount = useCartStore((s) => s.itemCount())

  return (
    <nav className={styles.nav}>
      <Link href="/" aria-label="7ENO home">
        <Logo fg="#F6F3EC" height={24} />
      </Link>
      <div className={styles.links}>
        <Link href="/shop" className={styles.link}>Shop</Link>
        <button className={styles.cartBtn} onClick={onCartOpen} aria-label="Open cart">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          {itemCount > 0 && (
            <span className={styles.cartCount}>{itemCount}</span>
          )}
        </button>
      </div>
    </nav>
  )
}
