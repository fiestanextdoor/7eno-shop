// app/shop/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard/ProductCard'
import ShopSidebar from '@/components/ShopSidebar/ShopSidebar'
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

  // Filter by gender
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

  // Filter by line
  if (line === 'daily') {
    const filtered = products.filter((p) => p.name.toLowerCase().includes('daily'))
    products = filtered.length > 0 ? filtered : products
  } else if (line === 'sport') {
    const filtered = products.filter((p) => p.name.toLowerCase().includes('sport'))
    products = filtered.length > 0 ? filtered : products
  }

  const genderParam = gender ? `?gender=${gender}` : ''
  const dailyHref = `/shop?line=daily${gender ? `&gender=${gender}` : ''}`
  const sportHref = `/shop?line=sport${gender ? `&gender=${gender}` : ''}`
  const allHref = `/shop${genderParam}`

  return (
    <div className={styles.layout}>
      <div className={styles.sidebar}>
        <ShopSidebar gender={gender} line={line} />
      </div>

      <main className={styles.main}>
        <div className={styles.tabs}>
          <Link
            href={allHref}
            className={!line ? `${styles.tab} ${styles.tabActive}` : styles.tab}
          >
            All
          </Link>
          <div className={styles.tabDivider} />
          <Link
            href={dailyHref}
            className={line === 'daily' ? `${styles.tab} ${styles.tabActive}` : styles.tab}
          >
            7ENO Daily
          </Link>
          <div className={styles.tabDivider} />
          <Link
            href={sportHref}
            className={line === 'sport' ? `${styles.tab} ${styles.tabActive}` : styles.tab}
          >
            7ENO Sport
          </Link>
        </div>

        <div className={styles.grid}>
          {products.length === 0 ? (
            <p className={styles.empty}>No products found. Check back soon.</p>
          ) : (
            products.map((p) => <ProductCard key={p.id} product={p} />)
          )}
        </div>
      </main>
    </div>
  )
}
