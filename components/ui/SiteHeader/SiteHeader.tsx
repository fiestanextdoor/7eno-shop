'use client'

import Link from 'next/link'
import AccountButton from '@/components/AccountButton/AccountButton'
import { LogoWordmark } from '@/components/Logo/Logo'
import { isActivePath, type NavItem } from '@/lib/nav'
import styles from './SiteHeader.module.css'

export interface SiteHeaderProps {
  nav: NavItem[]
  cartCount: number
  currentPath: string
  menuOpen: boolean
  onMenuOpen(): void
  onCartOpen(): void
}

export default function SiteHeader({ nav, cartCount, currentPath, menuOpen, onMenuOpen, onCartOpen }: SiteHeaderProps) {
  const cartLabel = cartCount > 0 ? `Open cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}` : 'Open cart'

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <button
          type="button"
          className={styles.iconButton + ' ' + styles.menuButton}
          onClick={onMenuOpen}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label="Open menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M2 5h16M2 10h16M2 15h16" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>

        <Link href="/" className={styles.logo} aria-label="7ENO home">
          <LogoWordmark variant="ink" height={28} />
        </Link>

        <nav className={styles.nav} aria-label="Main">
          <ul className={styles.navList}>
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={styles.navLink}
                  aria-current={isActivePath(item.href, currentPath) ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.actions}>
          <AccountButton />
          <button type="button" className={styles.iconButton} onClick={onCartOpen} aria-label={cartLabel}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
            </svg>
            {cartCount > 0 && (
              <span className={styles.cartCount} aria-hidden="true">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
