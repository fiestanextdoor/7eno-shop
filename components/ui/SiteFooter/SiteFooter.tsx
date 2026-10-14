import Link from 'next/link'
import { HELP_NAV, LEGAL_NAV, type NavItem } from '@/lib/nav'
import styles from './SiteFooter.module.css'

export interface SiteFooterProps {
  nav: NavItem[]
}

function FooterLink({ item }: { item: NavItem }) {
  if (item.external) {
    return <a href={item.href} className={styles.link}>{item.label}</a>
  }
  return <Link href={item.href} className={styles.link}>{item.label}</Link>
}

export default function SiteFooter({ nav }: SiteFooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        <div className={styles.brand}>
          <p className={styles.wordmark}>7ENO</p>
          <p className={styles.tagline}>Numbered editions by Abra Entertainment. Made to order.</p>
        </div>
        <nav className={styles.col} aria-label="Footer shop">
          <p className={styles.colTitle}>Shop</p>
          <ul className={styles.list}>
            {nav.map((item) => (
              <li key={item.href}><FooterLink item={item} /></li>
            ))}
          </ul>
        </nav>
        <nav className={styles.col} aria-label="Footer help">
          <p className={styles.colTitle}>Help</p>
          <ul className={styles.list}>
            {HELP_NAV.map((item) => (
              <li key={item.href}><FooterLink item={item} /></li>
            ))}
          </ul>
        </nav>
      </div>
      <div className={styles.bottom}>
        <p className={styles.legal}>© 2026 7ENO · KvK 42081073</p>
        <ul className={styles.legalLinks}>
          {LEGAL_NAV.map((item) => (
            <li key={item.href}><FooterLink item={item} /></li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
