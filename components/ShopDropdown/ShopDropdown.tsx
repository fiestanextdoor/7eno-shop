'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import styles from './ShopDropdown.module.css'

const ITEMS = ['Tees', 'Shorts', 'Swimwear', 'Headwear', 'Footwear']

const MENU = [
  {
    gender: 'Men',
    genderHref: '/shop?gender=men',
    lines: [
      { name: '7ENO Daily', href: '/shop?gender=men&line=daily' },
      { name: '7ENO Sport', href: '/shop?gender=men&line=sport' },
    ],
  },
  {
    gender: 'Women',
    genderHref: '/shop?gender=women',
    lines: [
      { name: '7ENO Daily', href: '/shop?gender=women&line=daily' },
      { name: '7ENO Sport', href: '/shop?gender=women&line=sport' },
    ],
  },
]

export default function ShopDropdown() {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }

  const handleLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120)
  }

  const close = () => setOpen(false)

  return (
    <div
      className={styles.wrapper}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        className={styles.trigger}
        aria-expanded={open}
        aria-haspopup="true"
      >
        Shop
        <span className={styles.caret} aria-hidden="true">▾</span>
      </button>

      <div
        className={`${styles.dropdown} ${open ? styles.dropdownOpen : ''}`}
        role="menu"
      >
        <div className={styles.grid}>
          {MENU.map((section) => (
            <div key={section.gender} className={styles.column}>
              <Link href={section.genderHref} className={styles.genderLink} onClick={close}>
                {section.gender}
              </Link>

              {section.lines.map((line) => (
                <div key={line.name} className={styles.lineGroup}>
                  <Link href={line.href} className={styles.lineTitle} onClick={close}>
                    {line.name}
                  </Link>
                  <ul className={styles.itemList}>
                    {ITEMS.map((item) => (
                      <li key={item}>
                        <Link href={line.href} className={styles.item} onClick={close}>
                          {item}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
