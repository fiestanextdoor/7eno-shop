'use client'

import Link from 'next/link'
import FilterBar from '@/components/ui/FilterBar/FilterBar'
import ProductTile from '@/components/ui/ProductTile/ProductTile'
import type { FilterGroup } from '@/lib/filter-types'
import type { SortOption } from '@/lib/shop-query'
import type { TileProduct } from '@/lib/tiles'
import styles from './ShopView.module.css'

export interface ShopViewProps {
  filters: FilterGroup[]
  sort: string
  sortOptions: SortOption[]
  tiles: TileProduct[]
  emptyMessage?: string
  /** Shown under the empty message, e.g. the upcoming drop the filter points to. */
  emptyLink?: { href: string; label: string } | null
  /** Applies a filter or sort href in place (ShopBrowser); otherwise the chips navigate. */
  onNavigate?(href: string): void
}

/** Desktop tiles per row: the first row loads eagerly. */
const DESKTOP_COLUMNS = 4

/** FilterBar plus the 2px-gap grid: four per row from 768px, two below. */
export default function ShopView({
  filters, sort, sortOptions, tiles, emptyMessage = 'Nothing here yet.', emptyLink = null, onNavigate,
}: ShopViewProps) {
  return (
    <>
      <FilterBar filters={filters} sort={sort} sortOptions={sortOptions} resultCount={tiles.length} onNavigate={onNavigate} />
      {tiles.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>{emptyMessage}</p>
          {emptyLink && (
            <Link href={emptyLink.href} className={styles.emptyLink}>
              {emptyLink.label}
            </Link>
          )}
        </div>
      ) : (
        <ul className={styles.grid}>
          {tiles.map((tile, i) => (
            <li key={tile.slug} className={styles.cell}>
              <ProductTile product={tile} eager={i < DESKTOP_COLUMNS} headingLevel="h2" />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
