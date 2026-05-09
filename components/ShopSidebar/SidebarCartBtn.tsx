// components/ShopSidebar/SidebarCartBtn.tsx
'use client'

import { useCartStore } from '@/store/cart'
import styles from './ShopSidebar.module.css'

export default function SidebarCartBtn() {
  const openCart = useCartStore((s) => s.openCart)
  return (
    <div className={styles.cartSection}>
      <button className={styles.cartBtn} onClick={openCart} aria-label="Open cart">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      </button>
    </div>
  )
}
