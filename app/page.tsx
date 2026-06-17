import Hero from '@/components/Hero/Hero'
import Marquee from '@/components/Marquee/Marquee'
import ProductCarousel, { type CarouselItem } from '@/components/ProductCarousel/ProductCarousel'
import { getCatalogProducts } from '@/lib/catalog'
import { getProductCardImages } from '@/lib/product-images'
import { productSlug } from '@/lib/slug'
import { removeBackground } from '@/lib/remove-bg'
import type { NormalizedProduct } from '@/types/catalog'
import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: '7ENO · Premium Streetwear',
  description:
    '7ENO is the official online streetwear store. Sign in with Google to place orders, track your shipments and manage your account.',
}

const CATEGORIES = [
  { num: '01', name: '7ENO Daily', href: '/shop?line=daily', logo: '/logos/7eno-daily.png' },
  { num: '02', name: '7ENO Sport', href: '/shop?line=sport', logo: '/logos/7eno-sport.png' },
]

/** Fisher-Yates shuffle so the carousel shows the full catalog in random order. */
function shuffle<T>(input: T[]): T[] {
  const arr = [...input]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export default async function HomePage() {
  let products: NormalizedProduct[] = []
  try {
    products = await getCatalogProducts()
  } catch (err) {
    console.error('[Catalog] getCatalogProducts failed:', err)
  }

  // Build the carousel cards: prefer a local front photo (no background removal
  // needed), otherwise the background-removed provider thumbnail. Both reuse the
  // same Supabase cache as /shop, so this adds no remove.bg calls for products
  // already shown there.
  const carouselItems: CarouselItem[] = await Promise.all(
    shuffle(products).map(async (p) => {
      const slug = productSlug(p.name)
      const local = getProductCardImages(slug).front
      const image =
        local ??
        (p.thumbnailUrl ? await removeBackground(p.thumbnailUrl).catch(() => null) : null) ??
        p.thumbnailUrl
      return { slug, name: p.name, image }
    })
  )

  return (
    <main className={styles.homeMain}>
      <Hero />

      <Marquee />

      <section className={styles.intro}>
        <div className={styles.introInner}>
          <p className={styles.introKicker}>7ENO</p>
          <h2 className={styles.introTitle}>The official 7ENO streetwear store</h2>
          <p className={styles.introText}>
            7ENO is the official online streetwear store. Browse the collection,
            create an account or sign in with Google, and place orders, track
            your shipments and manage your details.
          </p>
        </div>
      </section>

      <section className={styles.categoryStrip}>
        <div className={styles.categoryStripInner}>
          {CATEGORIES.map((cat) => (
            <Link key={cat.num} href={cat.href} className={styles.categoryCard}>
              <span className={styles.categoryNum}>{cat.num}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cat.logo} alt={cat.name} className={styles.categoryLogo} />
              <span className={styles.categoryArrow}>Shop →</span>
            </Link>
          ))}
        </div>
      </section>

      {carouselItems.length > 0 && (
        <section className={styles.carouselSection}>
          <div className={styles.carouselHeader}>
            <p className={styles.carouselLabel}>The Collection</p>
            <h2 className={styles.carouselTitle}>In rotation</h2>
          </div>
          <ProductCarousel items={carouselItems} />
          <div className={styles.carouselFooter}>
            <Link href="/shop" className={styles.viewAll}>View all products →</Link>
          </div>
        </section>
      )}
    </main>
  )
}
