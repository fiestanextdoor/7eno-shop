'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import styles from './ShopDropdown.module.css'

const LINES = [
  {
    id: 'men-daily',
    label: 'Men Daily',
    href: '/shop?gender=men&line=daily',
    items: ['Tees', 'Shorts', 'Swimwear', 'Headwear', 'Footwear'],
  },
  {
    id: 'men-sport',
    label: 'Men Sport',
    href: '/shop?gender=men&line=sport',
    items: ['Tees', 'Shorts'],
  },
  {
    id: 'women-daily',
    label: 'Women Daily',
    href: '/shop?gender=women&line=daily',
    items: ['Tees', 'Shorts', 'Swimwear', 'Headwear', 'Footwear'],
  },
  {
    id: 'women-sport',
    label: 'Women Sport',
    href: '/shop?gender=women&line=sport',
    items: ['Tees', 'Shorts'],
  },
  {
    id: 'unisex-daily',
    label: 'Unisex Daily',
    href: '/shop?gender=unisex&line=daily',
    items: ['Tees', 'Shorts', 'Headwear', 'Footwear'],
  },
  {
    id: 'unisex-sport',
    label: 'Unisex Sport',
    href: '/shop?gender=unisex&line=sport',
    items: ['Tees', 'Shorts'],
  },
]

export default function ShopDropdown() {
  const [open, setOpen] = useState(false)
  const [activeLine, setActiveLine] = useState<string | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }

  const handleLeave = () => {
    closeTimer.current = setTimeout(() => {
      setOpen(false)
      setActiveLine(null)
    }, 120)
  }

  const close = () => {
    setOpen(false)
    setActiveLine(null)
  }

  const activeLineData = LINES.find((l) => l.id === activeLine)

  return (
    <div
      className={styles.wrapper}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <Link href="/shop" className={styles.trigger} onClick={close} aria-expanded={open} aria-haspopup="true">
        Shop
        <span className={styles.caret} aria-hidden="true">▾</span>
      </Link>

      <div
        className={`${styles.dropdown} ${open ? styles.dropdownOpen : ''}`}
        role="menu"
      >
        {/* Row 1: Gender links */}
        <div className={styles.genderRow}>
          <Link href="/shop?gender=men" className={styles.genderLink} onClick={close}>
            Men
          </Link>
          <span className={styles.genderDivider} aria-hidden="true" />
          <Link href="/shop?gender=women" className={styles.genderLink} onClick={close}>
            Women
          </Link>
          <span className={styles.genderDivider} aria-hidden="true" />
          <Link href="/shop?gender=unisex" className={styles.genderLink} onClick={close}>
            Unisex
          </Link>
        </div>

        {/* Row 2: 4 line tiles */}
        <div className={styles.tilesRow}>
          {LINES.map((line) => (
            <button
              key={line.id}
              className={`${styles.tile} ${activeLine === line.id ? styles.tileActive : ''}`}
              onMouseEnter={() => setActiveLine(line.id)}
              onClick={() => setActiveLine(activeLine === line.id ? null : line.id)}
            >
              {line.label}
            </button>
          ))}
        </div>

        {/* Row 3: Subcategories */}
        <div className={`${styles.subRow} ${activeLineData ? styles.subRowVisible : ''}`}>
          {activeLineData
            ? activeLineData.items.map((item) => (
                <Link
                  key={item}
                  href={`${activeLineData.href}&category=${item.toLowerCase()}`}
                  className={styles.subItem}
                  onClick={close}
                >
                  {item}
                </Link>
              ))
            : null}
        </div>
      </div>
    </div>
  )
}
