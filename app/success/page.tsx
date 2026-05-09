'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LogoBadge } from '@/components/Logo/Logo'
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
      <div className={styles.mark}>
        <LogoBadge variant="wit" size={100} />
      </div>
      <h1 className={styles.title}>Order Confirmed</h1>
      <p className={styles.body}>
        Your order has been placed and will be fulfilled by Printful.
        You will receive a confirmation email shortly.
      </p>
      {sessionId && (
        <p className={styles.id}>Order ref: {sessionId.slice(-12)}</p>
      )}
      <Link href="/shop" className={styles.shopLink}>
        Continue Shopping
      </Link>
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
