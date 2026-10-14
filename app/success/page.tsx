'use client'

import { Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { buttonClasses } from '@/components/ui/Button/Button'
import { useCartStore } from '@/store/cart'
import styles from './success.module.css'

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const clearCart = useCartStore((s) => s.clearCart)

  useEffect(() => {
    clearCart()
  }, [clearCart])

  return (
    <div className={styles.inner}>
      <p className={styles.label}>Order confirmed</p>
      <h1 className={styles.title}>Thank you</h1>
      <p className={styles.body}>
        Your order has been placed and a confirmation email is on its way. Every piece is made to order, so it ships
        within 5 to 10 business days.
      </p>
      {sessionId && (
        <p className={styles.ref}>
          <span className={styles.refLabel}>Order ref</span> <span>{sessionId.slice(-12)}</span>
        </p>
      )}
      <div className={styles.actions}>
        <Link href="/shop" className={buttonClasses('primary', 'lg')}>
          Continue shopping
        </Link>
        <Link href="/account/orders" className={styles.textLink}>
          View your orders
        </Link>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <main className={styles.page}>
      <Suspense fallback={null}>
        <SuccessContent />
      </Suspense>
    </main>
  )
}
