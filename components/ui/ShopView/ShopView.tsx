'use client'

import FilterBar from '@/components/ui/FilterBar/FilterBar'
import GridDensityToggle from '@/components/ui/GridDensityToggle/GridDensityToggle'
import ProductTile from '@/components/ui/ProductTile/ProductTile'
import { useGridDensity } from '@/hooks/useGridDensity'
import type { FilterGroup } from '@/components/ShopFilters/ShopFilters'
import type { SortOption } from '@/lib/shop-query'
import type { TileProduct } from '@/lib/tiles'
import styles from './ShopView.module.css'

export interface ShopViewProps {
  filters: FilterGroup[]
  sort: string
  sortOptions: SortOption[]
  tiles: TileProduct[]
  emptyMessage?: string
}

/** FilterBar plus the 2px-gap grid; owns the grid density (desktop 2/4, mobile 1/2). */
export default function ShopView({ filters, sort, sortOptions, tiles, emptyMessage = 'Nothing here yet.' }: ShopViewProps) {
  const [density, setDensity] = useGridDensity()

  const controls = (
    <>
      <div className={styles.mobileOnly}>
        <GridDensityToggle
          label="Products per row (mobile)"
          value={density.mobile}
          options={[1, 2]}
          onChange={(v) => setDensity({ mobile: v === 1 ? 1 : 2 })}
        />
      </div>
      <div className={styles.desktopOnly}>
        <GridDensityToggle
          value={density.desktop}
          options={[2, 4]}
          onChange={(v) => setDensity({ desktop: v === 2 ? 2 : 4 })}
        />
      </div>
    </>
  )

  return (
    <>
      <FilterBar filters={filters} sort={sort} sortOptions={sortOptions} controls={controls} resultCount={tiles.length} />
      {tiles.length === 0 ? (
        <p className={styles.empty}>{emptyMessage}</p>
      ) : (
        <ul className={styles.grid} data-mobile={density.mobile} data-desktop={density.desktop}>
          {tiles.map((tile, i) => (
            <li key={tile.slug} className={styles.cell}>
              <ProductTile product={tile} density={density.desktop} eager={i < density.desktop} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
