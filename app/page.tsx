import Hero from '@/components/Hero/Hero'
import Marquee from '@/components/Marquee/Marquee'
import LatestDrop from '@/components/LatestDrop/LatestDrop'
import { getProducts, getProduct, getEuSizeMapForProduct } from '@/lib/printful'
import { removeBackground } from '@/lib/remove-bg'
import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: '7ENO — Divine Authority',
  description: 'Premium streetwear. Divine Authority.',
}

const CATEGORIES = [
  { num: '01', name: '7ENO Daily', href: '/shop?line=daily', logo: '/logos/7eno-daily.png' },
  { num: '02', name: '7ENO Sport', href: '/shop?line=sport', logo: '/logos/7eno-sport.png' },
]

export default async function HomePage() {
  let hero = null
  try {
    const all = await getProducts()
    hero = all[0] ?? null
  } catch (err) {
    console.error('[Printful] getProducts failed:', err)
  }

  const [heroBgRemoved, heroDetail] = await Promise.all([
    hero?.thumbnail_url ? removeBackground(hero.thumbnail_url) : Promise.resolve(null),
    hero ? getProduct(String(hero.id)).catch(() => null) : Promise.resolve(null),
  ])

  const heroEuSizeMap = heroDetail
    ? await getEuSizeMapForProduct(heroDetail.sync_variants)
    : {}

  return (
    <main>
      <Hero />

      <Marquee />

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

      {hero && heroDetail && (
        <section className={styles.latestDrop}>
          <div className={styles.latestDropInner}>
            <LatestDrop
              productId={hero.id}
              productName={hero.name}
              imageUrl={heroBgRemoved ?? hero.thumbnail_url}
              variants={heroDetail.sync_variants}
              euSizeMap={heroEuSizeMap}
            />
          </div>
        </section>
      )}
    </main>
  )
}
