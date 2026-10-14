'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import Button from '@/components/ui/Button/Button'
import Drawer from '@/components/ui/Drawer/Drawer'
import type { FilterGroup } from '@/components/ShopFilters/ShopFilters'
import type { SortOption } from '@/lib/shop-query'
import styles from './FilterBar.module.css'

export interface FilterBarProps {
  filters: FilterGroup[]
  sort: string
  sortOptions?: SortOption[]
  /** Extra controls on the right, e.g. the grid density toggle. */
  controls?: ReactNode
  resultCount?: number
}

/** Sticky filter and sort bar under the header; below 1024px the chips live in a Drawer. */
export default function FilterBar({ filters, sort, sortOptions = [], controls, resultCount }: FilterBarProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  // A group counts as filtered when its active option is not the first ("All").
  const activeCount = filters.filter((g) => g.items.findIndex((i) => i.active) > 0).length

  const onSort = (value: string) => {
    const option = sortOptions.find((o) => o.value === value)
    if (option) router.push(option.href, { scroll: false })
  }

  const sortControl = (id: string) =>
    sortOptions.length > 0 ? (
      <div className={styles.sort}>
        <label htmlFor={id} className={styles.sortLabel}>Sort</label>
        <select id={id} className={styles.select} value={sort} onChange={(e) => onSort(e.target.value)}>
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    ) : null

  const chipGroups = (onNavigate?: () => void) =>
    filters.map((group) => (
      <div key={group.label} className={styles.group} role="group" aria-label={group.label}>
        <span className={styles.groupLabel} aria-hidden="true">{group.label}</span>
        <ul className={styles.chips}>
          {group.items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                scroll={false}
                className={styles.chip}
                aria-current={item.active ? 'true' : undefined}
                onClick={onNavigate}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    ))

  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        {filters.length > 0 && (
          <button
            type="button"
            className={styles.filtersButton}
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="filter-drawer"
          >
            {`Filters${activeCount > 0 ? ` (${activeCount})` : ''}`}
          </button>
        )}
        {filters.length > 0 && (
          <nav className={styles.groups} aria-label="Filters">
            {chipGroups()}
          </nav>
        )}
        <div className={styles.tools}>
          <div className={styles.desktopSort}>{sortControl('sort-desktop')}</div>
          {controls}
        </div>
      </div>

      {filters.length > 0 && (
        <Drawer
          open={open}
          onClose={() => setOpen(false)}
          side="left"
          title="Filters"
          id="filter-drawer"
          footer={
            <Button size="lg" className={styles.showResults} onClick={() => setOpen(false)}>
              {typeof resultCount === 'number'
                ? `Show ${resultCount} ${resultCount === 1 ? 'result' : 'results'}`
                : 'Done'}
            </Button>
          }
        >
          <div className={styles.drawerGroups}>{chipGroups(() => setOpen(false))}</div>
          {sortControl('sort-mobile')}
        </Drawer>
      )}
    </div>
  )
}
