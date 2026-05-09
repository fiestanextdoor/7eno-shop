import Hero from '@/components/Hero/Hero'
import ProductCard from '@/components/ProductCard/ProductCard'
import { getProducts } from '@/lib/printful'
import type { SyncProduct } from '@/types/printful'
import styles from './page.module.css'

export default async function HomePage() {
  let products: SyncProduct[] = []
  try {
    const all = await getProducts()
    products = all.slice(0, 3)
  } catch {
    // Printful unreachable on build/dev without connected store
  }

  return (
    <main>
      <Hero />
      {products.length > 0 && (
        <section className={styles.featured}>
          <div className={styles.featuredHeader}>
            <p className={styles.featuredLabel}>Latest Drops</p>
            <h2 className={styles.featuredTitle}>The Collection</h2>
          </div>
          <div className={styles.featuredGrid}>
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
