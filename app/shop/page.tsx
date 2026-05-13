import type { Metadata } from 'next'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard/ProductCard'
import { getProducts } from '@/lib/printful'
import type { SyncProduct } from '@/types/printful'
import styles from './shop.module.css'

export const metadata: Metadata = {
  title: 'Shop — 7ENO',
  description: 'Browse the full 7ENO collection.',
}

interface Props {
  searchParams: Promise<{ gender?: string; line?: string }>
}

export default async function ShopPage({ searchParams }: Props) {
  const { gender = '', line = '' } = await searchParams

  let allProducts: SyncProduct[] = []
  try {
    allProducts = await getProducts()
  } catch (err) {
    console.error('[Printful] getProducts failed:', err)
  }

  let products = allProducts
  if (gender === 'men') {
    const filtered = allProducts.filter((p) =>
      p.name.toLowerCase().includes('men') && !p.name.toLowerCase().includes('women')
    )
    products = filtered.length > 0 ? filtered : allProducts
  } else if (gender === 'women') {
    const filtered = allProducts.filter((p) =>
      p.name.toLowerCase().includes('women') || p.name.toLowerCase().includes('unisex')
    )
    products = filtered.length > 0 ? filtered : allProducts
  }

  if (line === 'daily') {
    const filtered = products.filter((p) => p.name.toLowerCase().includes('daily'))
    products = filtered.length > 0 ? filtered : products
  } else if (line === 'sport') {
    const filtered = products.filter((p) => p.name.toLowerCase().includes('sport'))
    products = filtered.length > 0 ? filtered : products
  }

  const filters = [
    { label: 'All',   href: '/shop',                                                  active: !gender && !line },
    { label: 'Men',   href: '/shop?gender=men',                                       active: gender === 'men' },
    { label: 'Women', href: '/shop?gender=women',                                     active: gender === 'women' },
    { label: 'Daily', href: `/shop?line=daily${gender ? `&gender=${gender}` : ''}`,   active: line === 'daily' },
    { label: 'Sport', href: `/shop?line=sport${gender ? `&gender=${gender}` : ''}`,   active: line === 'sport' },
  ]

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <p className={styles.headerLabel}>SS 2026</p>
            <h1 className={styles.title}>The Collection</h1>
          </div>
          <span className={styles.count}>{products.length} {products.length === 1 ? 'product' : 'products'}</span>
        </div>
        <nav className={styles.filters} aria-label="Filter products">
          {filters.map((f) => (
            <Link
              key={f.label}
              href={f.href}
              className={f.active ? `${styles.filter} ${styles.filterActive}` : styles.filter}
            >
              {f.label}
            </Link>
          ))}
        </nav>
      </header>

      {products.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No products yet.</p>
          <p className={styles.emptySub}>The collection is being assembled. Check back soon.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </main>
  )
}
