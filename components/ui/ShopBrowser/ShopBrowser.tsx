'use client'

import { useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import ShopView from '@/components/ui/ShopView/ShopView'
import {
  applyTileQuery, buildFilterGroups, buildSortOptions, describeShopQuery, parseShopQuery, type FilterDrop, type RawSearchParams,
} from '@/lib/shop-query'
import type { DropId } from '@/lib/drops'
import type { TileProduct } from '@/lib/tiles'
import styles from './ShopBrowser.module.css'

export interface ShopBrowserProps {
  /** Every listed tile; the browser filters them itself. */
  tiles: TileProduct[]
  /** The listed drops, with their status, for the collection chips and the empty state. */
  drops: FilterDrop[]
  /** On a collection page: the collection is fixed, links stay on its path and the page has its own heading. */
  collection?: { id: DropId; basePath: string }
}

/**
 * The shop listing with filters that apply in the browser. The server sends
 * all listed tiles once; a chip or sort only rewrites the URL (history
 * pushState, which Next mirrors into useSearchParams) and the grid re-renders
 * from memory. No request, no server render, no flash while Printful answers.
 * The first render still follows the URL, so a shared filter link is right
 * straight from the server.
 */
export default function ShopBrowser({ tiles, drops, collection }: ShopBrowserProps) {
  const params = useSearchParams()
  const query = useMemo(() => {
    const raw: RawSearchParams = {}
    params.forEach((value, key) => {
      if (!(key in raw)) raw[key] = value
    })
    const parsed = parseShopQuery(raw)
    return collection ? { ...parsed, collection: collection.id } : parsed
  }, [params, collection])

  const visible = useMemo(() => applyTileQuery(tiles, query), [tiles, query])
  const { title } = describeShopQuery(query)
  // Filtering on a drop that has not opened yet: point to its waitlist.
  const upcomingDrop = drops.find((d) => d.id === query.collection && d.status === 'upcoming')
  const emptyLink = upcomingDrop
    ? { href: `/collections/${upcomingDrop.slug}`, label: 'See the drop and join the waitlist' }
    : null

  const href = collection ? { base: collection.basePath, withCollection: false } : {}

  const navigate = useCallback((href: string) => {
    window.history.pushState(null, '', href)
  }, [])

  return (
    <>
      {!collection && (
        <header className={styles.header} data-reveal="hero">
          <p className={styles.label}>Shop</p>
          <h1 className={styles.title}>{title}</h1>
        </header>
      )}
      <ShopView
        filters={buildFilterGroups(query, drops, href)}
        sort={query.sort}
        sortOptions={buildSortOptions(query, href)}
        tiles={visible}
        emptyMessage="No pieces match these filters yet."
        emptyLink={emptyLink}
        onNavigate={navigate}
      />
    </>
  )
}
