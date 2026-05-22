import type { Metadata } from 'next'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard/ProductCard'
import { getProducts, getProduct } from '@/lib/printful'
import { removeBackground } from '@/lib/remove-bg'
import type { SyncProduct } from '@/types/printful'
import styles from './shop.module.css'

export const metadata: Metadata = {
  title: 'Shop — 7ENO',
  description: 'Browse the full 7ENO collection.',
}

// ── Custom product catalogue (filter by Printful ID) ──────────────────────────

const GENDER_IDS: Record<string, number[]> = {
  men: [
    433344927, 433344876, 433344735, 432343313, // Tee Men
    433345077,                                   // Swim Shorts
    433345518, 433345476, 433345296,             // Sport Tee Unisex
    433351405, 433351139, 433350977, 433350867,  // Sport Shorts Unisex
  ],
  women: [
    433345279, 433345190, 433345163, // Tee Women
    433351920,                        // Bikini
    433351254,                        // Loafers Women
  ],
  unisex: [
    433345077,                        // Swim Shorts
    433345518, 433345476, 433345296,  // Sport Tee Unisex
    433351405, 433351139, 433350977, 433350867, // Sport Shorts Unisex
  ],
}

const LINE_IDS: Record<string, number[]> = {
  // Daily = normal clothing only (no sport, no accessories)
  daily: [
    433345279, 433345190, 433345163, // Tee Women
    433344927, 433344876, 433344735, 432343313, // Tee Men
    433351920,                        // Bikini
    433345077,                        // Swim Shorts
  ],
  // Sport = sport clothing only (no accessories)
  sport: [
    433345518, 433345476, 433345296, // Sport Tee Unisex
    433351405, 433351139, 433350977, 433350867, // Sport Shorts Unisex
  ],
}

const CATEGORY_IDS: Record<string, number[]> = {
  tees:     [433345279, 433345190, 433345163, 433344927, 433344876, 433344735, 432343313, 433345518, 433345476, 433345296],
  shorts:   [433351405, 433351139, 433350977, 433350867],
  swimwear: [433351920, 433345077],
  headwear: [433354226, 433351639, 433351026],
  footwear: [433351254],
}

// Default display order when no line filter is active
const SORT_PRIORITY: Record<number, number> = {
  // 1. Normal clothing — Women
  433345279: 0, 433345190: 1, 433345163: 2,
  // 1. Normal clothing — Men
  433344927: 3, 433344876: 4, 433344735: 5, 432343313: 6,
  // 2. Sportswear
  433345518: 10, 433345476: 11, 433345296: 12,
  433351405: 13, 433351139: 14, 433350977: 15, 433350867: 16,
  // 3. Swimwear
  433351920: 20, 433345077: 21,
  // 4. Accessories
  433354226: 30, 433351639: 31, 433351026: 32,
  433351254: 33,
  433344612: 34, // Towel
  433353836: 40, 433353269: 41, 433352871: 42, 433352744: 43, 433352490: 44,
}

const NO_LINE_CATEGORIES = new Set(['swimwear', 'headwear', 'footwear'])

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

  let products = [...allProducts]

  // 1. Gender filter
  if (gender && GENDER_IDS[gender]) {
    const ids = new Set(GENDER_IDS[gender])
    products = products.filter((p) => ids.has(p.id))
  }

  // 2. Line filter — skip for categories that have no daily/sport split
  const effectiveLine = NO_LINE_CATEGORIES.has(category) ? '' : line
  if (effectiveLine && LINE_IDS[effectiveLine]) {
    const ids = new Set(LINE_IDS[effectiveLine])
    products = products.filter((p) => ids.has(p.id))
  }

  // 3. Category filter
  if (category && CATEGORY_IDS[category]) {
    const ids = new Set(CATEGORY_IDS[category])
    products = products.filter((p) => ids.has(p.id))
  }

  // 4. Sort: normal clothing → sportswear → swimwear → accessories
  products.sort((a, b) =>
    (SORT_PRIORITY[a.id] ?? 99) - (SORT_PRIORITY[b.id] ?? 99)
  )

  // Remove.bg + color count in parallel for all filtered products
  const [bgRemovedUrls, colorCountMap] = await Promise.all([
    Promise.all(
      products.map((p) =>
        p.thumbnail_url ? removeBackground(p.thumbnail_url) : Promise.resolve(null)
      )
    ),
    Promise.all(
      products.map((p) =>
        getProduct(String(p.id))
          .then(({ sync_variants }) => {
            const colors = new Set(sync_variants.filter((v) => v.color).map((v) => v.color))
            return { id: p.id, count: colors.size }
          })
          .catch(() => ({ id: p.id, count: 0 }))
      )
    ).then((entries) => Object.fromEntries(entries.map((e) => [e.id, e.count]))),
  ])

  const genderFilters = [
    { label: 'All',    href: buildHref({ line, category }),                    active: !gender },
    { label: 'Men',    href: buildHref({ gender: 'men',    line, category }),  active: gender === 'men' },
    { label: 'Women',  href: buildHref({ gender: 'women',  line, category }),  active: gender === 'women' },
    { label: 'Unisex', href: buildHref({ gender: 'unisex', line, category }),  active: gender === 'unisex' },
  ]

  const lineFilters = [
    { label: 'All lines', href: buildHref({ gender, category }),                   active: !line || NO_LINE_CATEGORIES.has(category) },
    { label: 'Daily',     href: buildHref({ gender, line: 'daily', category }),    active: line === 'daily' && !NO_LINE_CATEGORIES.has(category) },
    { label: 'Sport',     href: buildHref({ gender, line: 'sport', category }),    active: line === 'sport' && !NO_LINE_CATEGORIES.has(category) },
  ]

  const categoryFilters = [
    { label: 'All',       href: buildHref({ gender, line }),                                       active: !category },
    { label: 'Tees',      href: buildHref({ gender, line, category: 'tees' }),                     active: category === 'tees' },
    { label: 'Shorts',    href: buildHref({ gender, line, category: 'shorts' }),                   active: category === 'shorts' },
    { label: 'Swimwear',  href: buildHref({ gender, category: 'swimwear' }),                       active: category === 'swimwear' },
    { label: 'Headwear',  href: buildHref({ gender, category: 'headwear' }),                       active: category === 'headwear' },
    { label: 'Footwear',  href: buildHref({ gender, category: 'footwear' }),                       active: category === 'footwear' },
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

        <div className={styles.filterBar} role="navigation" aria-label="Filters">
          <div className={styles.filterGroup}>
            <span className={styles.filterGroupLabel}>Gender</span>
            <div className={styles.filterLinks}>
              {genderFilters.map((f) => (
                <Link key={f.label} href={f.href} className={f.active ? `${styles.filter} ${styles.filterActive}` : styles.filter}>
                  {f.label}
                </Link>
              ))}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <span className={styles.filterGroupLabel}>Line</span>
            <div className={styles.filterLinks}>
              {lineFilters.map((f) => (
                <Link key={f.label} href={f.href} className={f.active ? `${styles.filter} ${styles.filterActive}` : styles.filter}>
                  {f.label}
                </Link>
              ))}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <span className={styles.filterGroupLabel}>Category</span>
            <div className={styles.filterLinks}>
              {categoryFilters.map((f) => (
                <Link key={f.label} href={f.href} className={f.active ? `${styles.filter} ${styles.filterActive}` : styles.filter}>
                  {f.label}
                </Link>
              ))}
            </div>
          </div>
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
            <ProductCard key={p.id} product={p} index={i} imageUrl={bgRemovedUrls[i]} colorCount={colorCountMap[p.id]} />
          ))}
        </div>
      )}
    </main>
  )
}
