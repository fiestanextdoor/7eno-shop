'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './ShopFilters.module.css'

export interface FilterItem {
  label: string
  href: string
  active: boolean
}

export interface FilterGroup {
  label: string
  items: FilterItem[]
}

export default function ShopFilters({ groups }: { groups: FilterGroup[] }) {
  const [open, setOpen] = useState(false)

  // Close on Escape and lock body scroll while the drawer is open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  // A group is "filtered" when its active option isn't the first (the reset/All).
  const activeFilters = groups.filter((g) => g.items.findIndex((i) => i.active) > 0).length

  return (
    <>
      {/* Desktop: inline filter bar */}
      <div className={styles.bar} role="navigation" aria-label="Filters">
        {groups.map((g) => (
          <div key={g.label} className={styles.group}>
            <span className={styles.groupLabel}>{g.label}</span>
            <div className={styles.links}>
              {g.items.map((f) => (
                <Link
                  key={f.label}
                  href={f.href}
                  className={f.active ? `${styles.filter} ${styles.filterActive}` : styles.filter}
                >
                  {f.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: toggle button */}
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="shop-filter-drawer"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 5h18M6 12h12M10 19h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        Filters
        {activeFilters > 0 && <span className={styles.badge}>{activeFilters}</span>}
      </button>

      {/* Mobile: offcanvas drawer */}
      <div
        className={open ? styles.overlayVisible : styles.overlayHidden}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <aside
        id="shop-filter-drawer"
        className={open ? styles.drawerOpen : styles.drawerClosed}
        aria-label="Filters"
        aria-hidden={!open}
      >
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}>Filters</span>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => setOpen(false)}
            aria-label="Close filters"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <line x1="2" y1="2" x2="16" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="16" y1="2" x2="2" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className={styles.drawerBody}>
          {groups.map((g) => (
            <div key={g.label} className={styles.drawerGroup}>
              <span className={styles.drawerGroupLabel}>{g.label}</span>
              <div className={styles.drawerOptions}>
                {g.items.map((f) => (
                  <Link
                    key={f.label}
                    href={f.href}
                    onClick={() => setOpen(false)}
                    className={f.active ? `${styles.option} ${styles.optionActive}` : styles.option}
                  >
                    {f.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  )
}
