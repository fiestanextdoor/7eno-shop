import type { Metadata } from 'next'
import ProductCard from '@/components/ProductCard/ProductCard'
import { getProducts } from '@/lib/printful'
import type { SyncProduct } from '@/types/printful'
import styles from './shop.module.css'

export const metadata: Metadata = {
  title: 'Shop — 7ENO',
  description: 'Browse the full 7ENO collection.',
}

export default async function ShopPage() {
  let products: SyncProduct[] = []
  try {
    products = await getProducts()
  } catch (err) {
    console.error('[Printful] getProducts failed:', err)
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <p className={styles.label}>The Collection</p>
        <h1 className={styles.title}>All Products</h1>
      </div>
      <div className={styles.grid}>
        {products.length === 0 ? (
          <p className={styles.empty}>No products found. Check back soon.</p>
        ) : (
          products.map((p) => <ProductCard key={p.id} product={p} />)
        )}
      </div>
    </main>
  )
}
