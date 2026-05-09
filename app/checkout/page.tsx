'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCartStore } from '@/store/cart'
import styles from './checkout.module.css'

export default function CheckoutPage() {
  const { items, total } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Could not start checkout. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <main className={styles.page}>
        <div className={styles.inner}>
          <p className={styles.empty}>Your cart is empty.</p>
          <Link href="/shop" className={styles.backLink}>Back to Shop</Link>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>Checkout</h1>
        <span className={styles.label}>
          {items.length} item{items.length > 1 ? 's' : ''}
        </span>

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
                <div className={styles.itemVariant}>
                  {item.variantName} &middot; qty {item.quantity}
                </div>
              </div>
              <span className={styles.itemPrice}>
                &euro;{((parseFloat(item.price) || 0) * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className={styles.total}>
          <span className={styles.totalLabel}>Total</span>
          <span className={styles.totalAmount}>&euro;{total().toFixed(2)}</span>
        </div>

        {error && <p className={styles.error} aria-live="polite">{error}</p>}

        <button
          className={styles.payBtn}
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? 'Redirecting...' : 'Pay with Stripe'}
        </button>
      </div>
    </main>
  )
}
