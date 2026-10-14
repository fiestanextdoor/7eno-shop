import Link from 'next/link'
import { currentTimeMs } from '@/lib/drops'
import { notFoundLinks } from '@/lib/not-found'
import styles from './not-found.module.css'

export default function NotFound() {
  const links = notFoundLinks(currentTimeMs())
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.code}>404</h1>
        <p className={styles.text}>This page is not part of any edition.</p>
        <nav aria-label="Where to next">
          <ul className={styles.links}>
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={styles.link}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  )
}
