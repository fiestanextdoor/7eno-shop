// app/page.tsx
import Hero from '@/components/Hero/Hero'
import ProductCard from '@/components/ProductCard/ProductCard'
import { getProducts } from '@/lib/printful'
import type { SyncProduct } from '@/types/printful'
import type { Metadata } from 'next'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: '7ENO — Divine Authority',
  description: 'Premium streetwear. Divine Authority.',
}

export default async function HomePage() {
  let products: SyncProduct[] = []
  try {
    const all = await getProducts()
    products = all.slice(0, 4)
  } catch (err) {
    console.error('[Printful] getProducts failed:', err)
  }

  const hero = products[0] ?? null

  return (
    <main>
      <Hero
        productName={hero?.name ?? null}
        productImage={hero?.thumbnail_url ?? null}
      />
      {products.length > 1 && (
        <section className={styles.featured}>
          <div className={styles.featuredHeader}>
            <p className={styles.featuredLabel}>Latest Drops</p>
            <h2 className={styles.featuredTitle}>The Collection</h2>
          </div>
          <div className={styles.featuredGrid}>
            {products.slice(1).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
