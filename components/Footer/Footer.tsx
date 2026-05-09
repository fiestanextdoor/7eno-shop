import Link from 'next/link'
import { LogoWordmark } from '@/components/Logo/Logo'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <LogoWordmark variant="wit" height={28} />
          <p className={styles.tagline}>Divine Authority</p>
        </div>
        <nav className={styles.navGroup} aria-label="Shop navigation">
          <h4 className={styles.navTitle}>Shop</h4>
          <ul className={styles.navList}>
            <li><Link href="/shop" className={styles.navLink}>All Products</Link></li>
            <li><Link href="/shop?gender=men" className={styles.navLink}>Men</Link></li>
            <li><Link href="/shop?gender=women" className={styles.navLink}>Women</Link></li>
          </ul>
        </nav>
        <nav className={styles.navGroup} aria-label="Info navigation">
          <h4 className={styles.navTitle}>Info</h4>
          <ul className={styles.navList}>
            <li><a href="mailto:info@7eno.nl" className={styles.navLink}>Contact</a></li>
          </ul>
        </nav>
      </div>
      <div className={styles.bottom}>
        <span className={styles.copy}>© 2026 7ENO. Fulfilled by Printful.</span>
        <span className={styles.copy}>Divine Authority · MMXXVI</span>
      </div>
    </footer>
  )
}
