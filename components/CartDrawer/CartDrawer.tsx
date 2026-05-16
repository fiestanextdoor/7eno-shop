'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useCartStore } from '@/store/cart'
import styles from './CartDrawer.module.css'

export default function CartDrawer() {
  const isOpen = useCartStore((s) => s.isCartOpen)
  const closeCart = useCartStore((s) => s.closeCart)
  const items = useCartStore((s) => s.items)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const total = useCartStore((s) => s.total())

  return (
    <>
      <div
        className={isOpen ? styles.overlayVisible : styles.overlayHidden}
        onClick={closeCart}
        onKeyDown={(e) => e.key === 'Escape' && closeCart()}
        role="button"
        tabIndex={0}
        aria-label="Close cart"
      />
      <aside
        className={isOpen ? styles.drawerOpen : styles.drawerClosed}
        aria-label="Shopping cart"
        aria-hidden={!isOpen}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Cart</h2>
          <button className={styles.closeBtn} onClick={closeCart} aria-label="Close cart">
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <p className={styles.empty}>Your cart is empty.</p>
        ) : (
          <>
            <ul className={styles.items}>
              {items.map((item) => (
                <li key={item.variantId} className={styles.item}>
                  {item.imageUrl ? (
                    <div className={styles.thumb}>
                      <Image src={item.imageUrl} alt={item.productName} fill style={{ objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div className={styles.thumbPlaceholder} />
                  )}
                  <div className={styles.itemInfo}>
                    <div className={styles.itemName}>{item.productName}</div>
                    <div className={styles.itemVariant}>{item.variantName}</div>
                    <div className={styles.itemPrice}>
                      {item.currency} {(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </div>
                    <div className={styles.qtyRow}>
                      <button className={styles.qtyBtn} onClick={() => updateQuantity(item.variantId, item.quantity - 1)}>−</button>
                      <span className={styles.qty}>{item.quantity}</span>
                      <button className={styles.qtyBtn} onClick={() => updateQuantity(item.variantId, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                  <button className={styles.removeBtn} onClick={() => removeItem(item.variantId)} aria-label="Remove item">✕</button>
                </li>
              ))}
            </ul>
            <div className={styles.footer}>
              <div className={styles.total}>
                <span>Total</span>
                <span>{items[0]?.currency ?? 'EUR'} {total.toFixed(2)}</span>
              </div>
              <a href="/checkout" className={styles.checkoutBtn} onClick={closeCart}>
                Checkout
              </a>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
