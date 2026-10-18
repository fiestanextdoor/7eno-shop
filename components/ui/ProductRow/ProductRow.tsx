'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import ProductTile from '@/components/ui/ProductTile/ProductTile'
import type { TileProduct } from '@/lib/tiles'
import styles from './ProductRow.module.css'

export interface LineupImage {
  src: string
  alt: string
}

export interface ProductRowProps {
  /** Heading id, also the aria-labelledby of the track. */
  id: string
  label: string
  title: string
  /** "View the collection" link. */
  href: string
  tiles: TileProduct[]
  /** Shown instead of tiles while an edition has no products in the store yet. */
  lineup?: LineupImage[]
  /** First row on the page: its first items load eagerly. */
  eager?: boolean
}

/** Items visible at once on desktop; the arrows page by this many. */
const ROW_VISIBLE = 4

/**
 * An edition's products as one horizontally scrolling row under its own
 * heading: four in view on desktop, two on mobile, swipe or the arrow
 * buttons beside the title to see the rest. The arrows report where the row
 * is (disabled at either end), so a keyboard user knows when they have seen
 * everything. Without products the row shows the edition's line-up images.
 */
export default function ProductRow({ id, label, title, href, tiles, lineup = [], eager = false }: ProductRowProps) {
  const track = useRef<HTMLUListElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(true)
  const count = tiles.length > 0 ? tiles.length : lineup.length

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
  }, [count])

  const page = (direction: 1 | -1) => {
    const el = track.current
    if (!el) return
    el.scrollBy({ left: direction * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <section className={styles.row} aria-labelledby={id}>
      <div className={styles.head} data-reveal="up">
        <p className={styles.label}>{label}</p>
        <h2 id={id} className={styles.title}>{title}</h2>
        {count > ROW_VISIBLE && (
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
        <Link href={href} className={styles.link}>View the collection</Link>
      </div>
      <ul ref={track} className={styles.track} aria-labelledby={id} data-reveal="stagger">
        {tiles.length > 0
          ? tiles.map((tile, i) => (
              <li key={tile.slug} className={styles.cell}>
                <ProductTile product={tile} eager={eager && i < ROW_VISIBLE} />
              </li>
            ))
          : lineup.map((item, i) => (
              <li key={item.src} className={`${styles.cell} ${styles.lineupItem}`}>
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  loading={eager && i < ROW_VISIBLE ? 'eager' : 'lazy'}
                  className={styles.lineupImage}
                />
              </li>
            ))}
      </ul>
    </section>
  )
}
