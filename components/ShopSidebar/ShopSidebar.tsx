// components/ShopSidebar/ShopSidebar.tsx
import Link from 'next/link'
import { LogoWordmark } from '@/components/Logo/Logo'
import SidebarCartBtn from './SidebarCartBtn'
import styles from './ShopSidebar.module.css'

interface ShopSidebarProps {
  gender: string
  line: string
}

function buildHref(gender: string, line: string) {
  const params = new URLSearchParams()
  if (gender) params.set('gender', gender)
  if (line) params.set('line', line)
  const qs = params.toString()
  return `/shop${qs ? `?${qs}` : ''}`
}

export default function ShopSidebar({ gender, line }: ShopSidebarProps) {
  const menHref = buildHref('men', line)
  const womenHref = buildHref('women', line)
  const dailyHref = buildHref(gender, 'daily')
  const sportHref = buildHref(gender, 'sport')

  return (
    <aside className={styles.sidebar} aria-label="Shop navigation">
      <Link href="/" className={styles.logoSection} aria-label="7ENO home">
        <LogoWordmark variant="wit" height={26} />
        <span className={styles.sub}>by ultra entertainment</span>
      </Link>

      <nav className={styles.nav}>
        <div className={styles.genderRow}>
          <Link
            href={menHref}
            className={gender === 'men' ? `${styles.genderLink} ${styles.genderLinkActive}` : styles.genderLink}
          >
            Men
          </Link>
          <div className={styles.genderDivider} />
          <Link
            href={womenHref}
            className={gender === 'women' ? `${styles.genderLink} ${styles.genderLinkActive}` : styles.genderLink}
          >
            Women
          </Link>
        </div>

        {(gender === 'men' || gender === 'women') && (
          <>
            <div className={styles.categoryGroup}>
              <span className={styles.categoryLabel}>7ENO Daily</span>
              <ul className={styles.subLinks}>
                {['Tees', 'Shorts', 'Swimwear', 'Headwear', 'Footwear'].map((item) => (
                  <li key={item}>
                    <Link
                      href={dailyHref}
                      className={line === 'daily' ? `${styles.subLink} ${styles.subLinkActive}` : styles.subLink}
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.categoryGroup}>
              <span className={styles.categoryLabel}>7ENO Sport</span>
              <ul className={styles.subLinks}>
                {['Tees', 'Shorts', 'Swimwear', 'Headwear', 'Footwear'].map((item) => (
                  <li key={item}>
                    <Link
                      href={sportHref}
                      className={line === 'sport' ? `${styles.subLink} ${styles.subLinkActive}` : styles.subLink}
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {!gender && (
          <div className={styles.categoryGroup}>
            <Link href="/shop" className={styles.subLink}>All Products</Link>
          </div>
        )}
      </nav>

      <SidebarCartBtn />
    </aside>
  )
}
