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

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  tees:      ['tee', 't-shirt', 'tshirt', 'shirt'],
  shorts:    ['short'],
  swimwear:  ['swim', 'swimwear', 'trunk', 'bikini'],
  headwear:  ['hat', 'cap', 'beanie', 'headwear', 'bucket'],
  footwear:  ['sock', 'shoe', 'sneaker', 'footwear', 'sandal'],
}

function buildHref(params: { gender?: string; line?: string; category?: string }) {
  const parts: string[] = []
  if (params.gender)   parts.push(`gender=${params.gender}`)
  if (params.line)     parts.push(`line=${params.line}`)
  if (params.category) parts.push(`category=${params.category}`)
  return `/shop${parts.length ? `?${parts.join('&')}` : ''}`
}

interface Props {
  searchParams: Promise<{ gender?: string; line?: string; category?: string }>
}

export default async function ShopPage({ searchParams }: Props) {
  const { gender = '', line = '', category = '' } = await searchParams

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

  if (category && CATEGORY_KEYWORDS[category]) {
    const keywords = CATEGORY_KEYWORDS[category]
    const filtered = products.filter((p) =>
      keywords.some((kw) => p.name.toLowerCase().includes(kw))
    )
    products = filtered.length > 0 ? filtered : products
  }

  const genderFilters = [
    { label: 'All',   href: buildHref({ line, category }),                  active: !gender },
    { label: 'Men',   href: buildHref({ gender: 'men',   line, category }), active: gender === 'men' },
    { label: 'Women', href: buildHref({ gender: 'women', line, category }), active: gender === 'women' },
  ]

  const lineFilters = [
    { label: 'All lines', href: buildHref({ gender, category }),                   active: !line },
    { label: 'Daily',     href: buildHref({ gender, line: 'daily', category }),    active: line === 'daily' },
    { label: 'Sport',     href: buildHref({ gender, line: 'sport', category }),    active: line === 'sport' },
  ]

  const categoryFilters = [
    { label: 'All',       href: buildHref({ gender, line }),                              active: !category },
    { label: 'Tees',      href: buildHref({ gender, line, category: 'tees' }),            active: category === 'tees' },
    { label: 'Shorts',    href: buildHref({ gender, line, category: 'shorts' }),          active: category === 'shorts' },
    { label: 'Swimwear',  href: buildHref({ gender, line, category: 'swimwear' }),        active: category === 'swimwear' },
    { label: 'Headwear',  href: buildHref({ gender, line, category: 'headwear' }),        active: category === 'headwear' },
    { label: 'Footwear',  href: buildHref({ gender, line, category: 'footwear' }),        active: category === 'footwear' },
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

        <div className={styles.filterGroups}>
          <nav className={styles.filters} aria-label="Filter by gender">
            {genderFilters.map((f) => (
              <Link key={f.label} href={f.href} className={f.active ? `${styles.filter} ${styles.filterActive}` : styles.filter}>
                {f.label}
              </Link>
            ))}
            <span className={styles.filterDivider} />
            {lineFilters.map((f) => (
              <Link key={f.label} href={f.href} className={f.active ? `${styles.filter} ${styles.filterActive}` : styles.filter}>
                {f.label}
              </Link>
            ))}
          </nav>

          <nav className={styles.filters} aria-label="Filter by category">
            {categoryFilters.map((f) => (
              <Link key={f.label} href={f.href} className={f.active ? `${styles.filter} ${styles.filterActive}` : styles.filter}>
                {f.label}
              </Link>
            ))}
          </nav>
        </div>
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
