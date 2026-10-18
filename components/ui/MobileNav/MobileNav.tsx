'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { useFocusTrap, useScrollLock } from '@/hooks/useFocusTrap'
import { HELP_NAV, isActivePath, type NavItem } from '@/lib/nav'
import styles from './MobileNav.module.css'

export interface MobileNavProps {
  nav: NavItem[]
  open: boolean
  onClose(): void
  currentPath: string
}

/** Full-screen menu below 1024px. Focus is trapped while open; Escape closes it. */
export default function MobileNav({ nav, open, onClose, currentPath }: MobileNavProps) {
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, open, onClose)
  useScrollLock(open)

  return (
    <div
      ref={ref}
      id="mobile-nav"
      className={styles.root}
      data-open={open ? 'true' : 'false'}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      inert={!open}
      tabIndex={-1}
    >
      <div className={styles.top}>
        <span className={styles.label}>Menu</span>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close menu">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      <nav aria-label="Mobile">
        <ul className={styles.list}>
          {nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={styles.link}
                onClick={onClose}
                aria-current={isActivePath(item.href, currentPath) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <ul className={styles.secondary}>
        <li>
          <Link href="/account" className={styles.secondaryLink} onClick={onClose}>
            Account
          </Link>
        </li>
        {HELP_NAV.filter((item) => !item.external).map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={styles.secondaryLink} onClick={onClose}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
