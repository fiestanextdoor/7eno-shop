'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './CookieBanner.module.css'

const STORAGE_KEY = '7eno_cookie_consent'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
    }
  }, [])

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    setVisible(false)
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className={styles.banner} role="dialog" aria-label="Cookie consent">
      <p className={styles.text}>
        We use functional cookies to keep your cart working.{' '}
        <Link href="/privacy" className={styles.policyLink}>Privacy Policy</Link>
      </p>
      <div className={styles.actions}>
        <button onClick={decline} className={styles.decline}>Decline</button>
        <button onClick={accept} className={styles.accept}>Accept</button>
      </div>
    </div>
  )
}
