import Hero from '@/components/Hero/Hero'
import Marquee from '@/components/Marquee/Marquee'
import ProductCarousel, { type CarouselItem } from '@/components/ProductCarousel/ProductCarousel'
import { getCatalogProducts, getCatalogProduct } from '@/lib/catalog'
import { resolveCardImage } from '@/lib/card-image'
import { productSlug } from '@/lib/slug'
import type { NormalizedProduct } from '@/types/catalog'
import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: '7ENO · Premium Streetwear',
  description:
    '7ENO is the official online streetwear store. Sign in with Google to place orders, track your shipments and manage your account.',
}

// Drop background photos at these paths to fill the line blocks; until then each
// block falls back to its logo on a solid brand colour (see page.module.css).
const CATEGORIES = [
  { num: '01', name: '7ENO Daily', href: '/shop?line=daily', logo: '/logos/7eno-daily.png', image: '/categories/daily.jpg' },
  { num: '02', name: '7ENO Sport', href: '/shop?line=sport', logo: '/logos/7eno-sport.png', image: '/categories/sport.jpg' },
]

// Newest products lead the carousel. Only Printify exposes a creation date at
// list level, so date-less products (Printful) sort last in a stable order.
const MAX_CAROUSEL_ITEMS = 16

function createdMs(p: NormalizedProduct): number {
  if (!p.createdAt) return 0
  const ms = Date.parse(p.createdAt.replace(' ', 'T'))
  return Number.isNaN(ms) ? 0 : ms
}

/**
 * Ensure a product has its variants/colours for the carousel's quick-add. Printify
 * list products already carry them; Printful list products do not, so we fetch the
 * detail for those (cached by the same ISR window as the rest of the page).
 */
async function withVariants(p: NormalizedProduct): Promise<NormalizedProduct> {
  if (p.variants.length > 0) return p
  try {
    return await getCatalogProduct(p.provider, p.id)
  } catch {
    return p
  }
}

export default async function HomePage() {
  let products: NormalizedProduct[] = []
  try {
    products = await getCatalogProducts()
  } catch (err) {
    console.error('[Catalog] getCatalogProducts failed:', err)
  }

  const latest = [...products].sort((a, b) => createdMs(b) - createdMs(a)).slice(0, MAX_CAROUSEL_ITEMS)

  // Build the carousel cards: the (background-removed) card image plus the
  // variants/colours the quick-add control needs. Image resolution reuses the
  // same Supabase cache as /shop, so it adds no extra remove.bg calls.
  const carouselItems: CarouselItem[] = await Promise.all(
    latest.map(async (p) => {
      const slug = productSlug(p.name)
      const [image, detailed] = await Promise.all([
        resolveCardImage({ slug, thumbnailUrl: p.thumbnailUrl }),
        withVariants(p),
      ])
      return {
        slug,
        name: p.name,
        image,
        provider: p.provider,
        productId: p.id,
        currency: detailed.currency,
        colors: detailed.colors.map((c) => ({
          color: c.color,
          hex: c.hex,
          displayName: c.displayName,
        })),
        variants: detailed.variants.map((v) => ({
          id: v.id,
          color: v.color,
          size: v.size,
          name: v.name,
          priceCents: v.priceCents,
          inStock: v.inStock,
        })),
      }
    })
  )

  return (
    <main>
      <Hero />

      <Marquee />

      {carouselItems.length > 0 && (
        <section className={styles.carouselSection}>
          <ProductCarousel items={carouselItems} />
        </section>
      )}

      <section className={styles.categoryStrip}>
        <div className={styles.categoryStripInner}>
          {CATEGORIES.map((cat) => (
            <Link key={cat.num} href={cat.href} className={styles.categoryCard}>
              <span
                className={styles.categoryMedia}
                style={{ backgroundImage: `url(${cat.image})` }}
                aria-hidden
              />
              <span className={styles.categoryNum}>{cat.num}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cat.logo} alt={cat.name} className={styles.categoryLogo} />
              <span className={styles.categoryArrow}>Shop →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.dealsBand}>
        <span className={styles.dealsMedia} aria-hidden />
        <div className={styles.dealsContent}>
          <p className={styles.dealsLabel}>Curated sets · by Abra Entertainment</p>
          <h2 className={styles.dealsTitle}>Deals</h2>
          <p className={styles.dealsSub}>
            Premium 7ENO pieces bundled at a combined price. Limited sets, while they last.
          </p>
          <Link href="/deals" className={styles.dealsCta}>Shop deals →</Link>
        </div>
      </section>
    </main>
  )
}
