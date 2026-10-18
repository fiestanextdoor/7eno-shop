import Link from 'next/link'
import type { ColourSibling } from '@/lib/colour-siblings'
import styles from './ColourSiblings.module.css'

export interface ColourSiblingsProps {
  items: ColourSibling[]
}

/** Swatches that link between the colours of one product family. */
export default function ColourSiblings({ items }: ColourSiblingsProps) {
  if (items.length < 2) return null
  const current = items.find((item) => item.current)
  return (
    <div className={styles.siblings}>
      <p className={styles.label}>
        <span className={styles.labelText}>Colour</span>
        {current && <span className={styles.value}>{current.name}</span>}
      </p>
      <ul className={styles.list}>
        {items.map((item) => {
          const name = item.soldOut ? `${item.name}, sold out` : item.name
          return (
            <li key={item.href}>
              {item.current ? (
                <span
                  className={styles.swatch}
                  style={{ background: item.hex }}
                  data-current="true"
                  data-sold-out={item.soldOut ? 'true' : undefined}
                  role="img"
                  aria-label={`${name}, selected`}
                />
              ) : (
                <Link
                  href={item.href}
                  className={styles.swatch}
                  style={{ background: item.hex }}
                  data-sold-out={item.soldOut ? 'true' : undefined}
                  aria-label={name}
                  title={name}
                />
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
