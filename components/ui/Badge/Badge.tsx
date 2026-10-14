import type { ReactNode } from 'react'
import styles from './Badge.module.css'

export type BadgeKind = 'new' | 'coming' | 'sold-out' | 'edition'

export const BADGE_LABELS: Record<Exclude<BadgeKind, 'edition'>, string> = {
  new: 'New in',
  coming: 'Coming soon',
  'sold-out': 'Sold out',
}

/** Small mono label on tiles and the product page. Colour is never the only signal: every badge carries text. */
export default function Badge({ kind, children }: { kind: BadgeKind; children?: ReactNode }) {
  const label = children ?? (kind === 'edition' ? null : BADGE_LABELS[kind])
  return (
    <span className={`${styles.badge} ${styles[kind]}`} data-kind={kind}>
      {label}
    </span>
  )
}
