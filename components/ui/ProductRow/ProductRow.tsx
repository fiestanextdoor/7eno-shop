'use client'

import { useEffect, useRef, useState } from 'react'
import ProductTile from '@/components/ui/ProductTile/ProductTile'
import type { TileProduct } from '@/lib/tiles'
import styles from './ProductRow.module.css'

export interface ProductRowProps {
  tiles: TileProduct[]
  /** Hooks the row up to its heading (aria-labelledby). */
  labelledBy: string
  /** First row on the page: its first tiles load eagerly. */
  eager?: boolean
}

/** Tiles visible at once on desktop; the arrows page by this many. */
export const ROW_VISIBLE = 4

/**
 * A collection's products as one horizontally scrolling row: four in view on
 * desktop, two on mobile, swipe or the arrow buttons to see the rest. The
 * arrows report where the row is (disabled at either end) so a keyboard
 * user knows when they have seen everything.
 */
export default function ProductRow({ tiles, labelledBy, eager = false }: ProductRowProps) {
  const track = useRef<HTMLUListElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(true)

  useEffect(() => {
    const el = track.current
    if (!el) return
    const update = () => {
      setAtStart(el.scrollLeft <= 1)
      setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1)
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null
    observer?.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      observer?.disconnect()
    }
  }, [tiles.length])

  const page = (direction: 1 | -1) => {
    const el = track.current
    if (!el) return
    el.scrollBy({ left: direction * el.clientWidth, behavior: 'smooth' })
  }

  const scrollable = tiles.length > ROW_VISIBLE

  return (
    <div className={styles.row}>
      {scrollable && (
        <div className={styles.arrows}>
          <button type="button" className={styles.arrow} onClick={() => page(-1)} disabled={atStart} aria-label="Previous products">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M10 3 5 8l5 5" />
            </svg>
          </button>
          <button type="button" className={styles.arrow} onClick={() => page(1)} disabled={atEnd} aria-label="Next products">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="m6 3 5 5-5 5" />
            </svg>
          </button>
        </div>
      )}
      <ul ref={track} className={styles.track} aria-labelledby={labelledBy} data-reveal="stagger">
        {tiles.map((tile, i) => (
          <li key={tile.slug} className={styles.cell}>
            <ProductTile product={tile} eager={eager && i < ROW_VISIBLE} />
          </li>
        ))}
      </ul>
    </div>
  )
}
