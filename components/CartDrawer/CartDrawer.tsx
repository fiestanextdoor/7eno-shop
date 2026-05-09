'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/store/cart'
import styles from './CartDrawer.module.css'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, removeItem, total } = useCartStore()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setVisible(true)
    } else {
      const timer = setTimeout(() => setVisible(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!visible && !isOpen) return null

  return (
    <>
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : styles.overlayHidden}`}
        onClick={onClose}
        role="button"
        aria-label="Close cart"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? onClose() : undefined}
      />
      <aside className={`${styles.drawer} ${isOpen ? styles.drawerOpen : styles.drawerClosed}`}>
        <div className={styles.header}>
          <span className={styles.title}>Your Cart</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close cart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <p className={styles.empty}>Your cart is empty.</p>
        ) : (
          <div className={styles.items}>
            {items.map((item) => (
              <div key={item.variantId} className={styles.item}>
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.productName}
                    width={72}
                    height={72}
                    className={styles.itemImg}
                  />
                ) : (
                  <div className={styles.itemImgPlaceholder} />
                )}
                <div>
                  <div className={styles.itemName}>{item.productName}</div>
                  <div className={styles.itemVariant}>{item.variantName} · qty {item.quantity}</div>
                  <div className={styles.itemPrice}>€{(parseFloat(item.price) * item.quantity).toFixed(2)}</div>
                </div>
                <button
                  className={styles.removeBtn}
                  onClick={() => removeItem(item.variantId)}
                  aria-label={`Remove ${item.productName}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.total}>
              <span className={styles.totalLabel}>Total</span>
              <span className={styles.totalAmount}>€{total().toFixed(2)}</span>
            </div>
            <Link href="/checkout" onClick={onClose} className={styles.checkoutBtn}>
              Proceed to Payment
            </Link>
          </div>
        )}
      </aside>
    </>
  )
}
