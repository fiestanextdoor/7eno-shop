'use client'

import Link from 'next/link'
import { LogoWordmark } from '@/components/Logo/Logo'
import { useCartStore } from '@/store/cart'
import styles from './CheckoutHeader.module.css'

/**
 * Header of the sealed checkout: the wordmark (not a link, so the shopper
 * stays in the flow) and one way out, back to the cart. The link goes to the
 * shop and opens the drawer through the store, which survives the client-side
 * navigation.
 */
export default function CheckoutHeader() {
  const openCart = useCartStore((s) => s.openCart)
  return (
    <header className={styles.header}>
      <Link href="/shop" className={styles.back} onClick={openCart}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <span>Back to cart</span>
      </Link>
      <div className={styles.logo}>
        <LogoWordmark variant="ink" height={28} align="center" priority />
      </div>
      <p className={styles.secure}>Secure checkout</p>
    </header>
  )
}
