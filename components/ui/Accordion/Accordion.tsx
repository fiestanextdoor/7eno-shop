import type { ReactNode } from 'react'
import styles from './Accordion.module.css'

export interface AccordionItem {
  title: string
  content: ReactNode
}

export interface AccordionProps {
  items: AccordionItem[]
  /** Index of the item that starts open. */
  defaultOpen?: number
}

/** Native details/summary: keyboard and screen-reader support come for free. */
export default function Accordion({ items, defaultOpen }: AccordionProps) {
  if (items.length === 0) return null
  return (
    <div className={styles.accordion}>
      {items.map((item, i) => (
        <details key={`${item.title}-${i}`} className={styles.item} open={i === defaultOpen ? true : undefined}>
          <summary className={styles.summary}>
            <span>{item.title}</span>
            <span className={styles.icon} aria-hidden="true" />
          </summary>
          <div className={styles.content}>{item.content}</div>
        </details>
      ))}
    </div>
  )
}
