import Link from 'next/link'
import { LogoWordmark } from '@/components/Logo/Logo'
import styles from './Footer.module.css'

const LINKS = {
  shop: [
    { label: 'Men', href: '/shop?gender=men' },
    { label: 'Women', href: '/shop?gender=women' },
    { label: '7ENO Daily', href: '/shop?line=daily' },
    { label: '7ENO Sport', href: '/shop?line=sport' },
  ],
  account: [
    { label: 'Sign in', href: '/account/login' },
    { label: 'Register', href: '/account/register' },
    { label: 'Orders', href: '/account/orders' },
    { label: 'Profile', href: '/account/profile' },
  ],
  info: [
    { label: 'Contact', href: 'mailto:info@7eno.nl' },
  ],
}

export default function Footer() {
  return (
    <footer className={styles.footer}>
      {/* Top: wordmark centered */}
      <div className={styles.top}>
        <Link href="/" aria-label="7ENO home">
          <LogoWordmark variant="butter" height={36} />
        </Link>
        <p className={styles.tagline}>Divine Authority · MMXXVI</p>
      </div>

      {/* Links grid */}
      <div className={styles.grid}>
        <div className={styles.col}>
          <p className={styles.colTitle}>Shop</p>
          <ul className={styles.list}>
            {LINKS.shop.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={styles.link}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.col}>
          <p className={styles.colTitle}>Account</p>
          <ul className={styles.list}>
            {LINKS.account.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={styles.link}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.col}>
          <p className={styles.colTitle}>Info</p>
          <ul className={styles.list}>
            {LINKS.info.map((l) => (
              <li key={l.href}>
                <a href={l.href} className={styles.link}>{l.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className={styles.bottom}>
        <span className={styles.copy}>© 2026 7ENO.</span>
        <span className={styles.copy}>All rights reserved.</span>
      </div>
    </footer>
  )
}
