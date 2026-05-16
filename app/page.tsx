import Hero from '@/components/Hero/Hero'
import Marquee from '@/components/Marquee/Marquee'
import ProductCard from '@/components/ProductCard/ProductCard'
import { getProducts } from '@/lib/printful'
import type { SyncProduct } from '@/types/printful'
import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: '7ENO — Divine Authority',
  description: 'Premium streetwear. Divine Authority.',
}

const CATEGORIES = [
  { num: '01', name: '7ENO Daily', href: '/shop?line=daily' },
  { num: '02', name: '7ENO Sport', href: '/shop?line=sport' },
]

export default async function HomePage() {
  let products: SyncProduct[] = []
  try {
    const all = await getProducts()
    products = all.slice(0, 7)
  } catch (err) {
    console.error('[Printful] getProducts failed:', err)
  }

  const hero = products[0] ?? null

  return (
    <main>
      <Hero />

      <Marquee />

      {products.length > 1 && (
        <section className={styles.featured}>
          <div className={styles.featuredInner}>
            <header className={styles.featuredHeader}>
              <div className={styles.featuredHeadings}>
                <p className={styles.featuredLabel}>Latest Drops</p>
                <h2 className={styles.featuredTitle}>The Collection</h2>
              </div>
            </header>

            <div className={styles.featuredGrid}>
              {products.slice(1).map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>

            <div className={styles.featuredFooter}>
              <Link href="/shop" className={styles.viewAll}>
                View all products
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className={styles.categoryStrip}>
        <div className={styles.categoryStripInner}>
          {CATEGORIES.map((cat) => (
            <Link key={cat.num} href={cat.href} className={styles.categoryCard}>
              <span className={styles.categoryNum}>{cat.num}</span>
              <span className={styles.categoryName}>{cat.name}</span>
              <span className={styles.categoryArrow}>Shop →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.manifesto}>
        <div className={styles.manifestoInner}>
          <div className={styles.manifestoRule} />
          <blockquote className={styles.manifestoQuote}>
            "No gradients. No shadows.<br />No mortals."
          </blockquote>
          <p className={styles.manifestoSub}>Divine Authority · MMXXVI</p>
          <div className={styles.manifestoRule} />
        </div>
      </section>
    </main>
  )
}
