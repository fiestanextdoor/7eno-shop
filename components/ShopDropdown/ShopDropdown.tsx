'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { LogoWordmark } from '@/components/Logo/Logo'
import styles from './ShopDropdown.module.css'

export default function ShopDropdown() {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }

  const handleLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120)
  }

  const close = () => setOpen(false)

  return (
    <div
      className={styles.wrapper}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <Link href="/shop" className={styles.trigger} onClick={close} aria-expanded={open} aria-haspopup="true">
        Shop
        <span className={styles.caret} aria-hidden="true">▾</span>
      </Link>

      <div
        className={`${styles.dropdown} ${open ? styles.dropdownOpen : ''}`}
        role="menu"
      >
        <div className={styles.tiles}>
          {/* The 7ENO wordmark leads to the original range. */}
          <Link
            href="/shop?line=og"
            className={styles.tile}
            onClick={close}
            role="menuitem"
            aria-label="OG Collection"
          >
            <span className={styles.tileMark}>
              <LogoWordmark variant="butter" height={34} align="center" />
            </span>
            <span className={styles.tileLabel}>OG Collection</span>
          </Link>

          {/* The Olympian mark leads to the Olympian capsule. */}
          <Link
            href="/shop?line=olympian"
            className={styles.tile}
            onClick={close}
            role="menuitem"
            aria-label="Olympian Collection"
          >
            <span className={styles.tileOlympian} aria-hidden="true" />
            <span className={styles.tileLabel}>Olympian Collection</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
