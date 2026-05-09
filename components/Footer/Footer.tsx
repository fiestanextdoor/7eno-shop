import Link from 'next/link'
import { SevenWordmark } from '@/components/Logo/Logo'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <SevenWordmark fg="#F6F3EC" height={28} />
          <p className={styles.tagline}>Divine Authority</p>
        </div>
        <nav className={styles.navGroup} aria-label="Shop navigation">
          <h4>Shop</h4>
          <ul>
            <li><Link href="/shop">All Products</Link></li>
          </ul>
        </nav>
        <nav className={styles.navGroup} aria-label="Info navigation">
          <h4>Info</h4>
          <ul>
            <li><a href="mailto:info@7eno.nl">Contact</a></li>
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
