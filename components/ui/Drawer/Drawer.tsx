'use client'

import { useId, useRef, type ReactNode } from 'react'
import { useFocusTrap, useScrollLock } from '@/hooks/useFocusTrap'
import styles from './Drawer.module.css'

export interface DrawerProps {
  open: boolean
  onClose(): void
  side: 'left' | 'right'
  title: string
  children: ReactNode
  /** Sticky area under the body, e.g. "Show 12 results" or the checkout button. */
  footer?: ReactNode
  id?: string
}

/**
 * Full-height side panel: base for the filter drawer (phase 2) and the cart
 * (phase 3). Stays mounted so it can slide; while closed it is inert, so it
 * is neither focusable nor read out.
 */
export default function Drawer({ open, onClose, side, title, children, footer, id }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useFocusTrap(panelRef, open, onClose)
  useScrollLock(open)

  return (
    <div className={styles.root} data-open={open ? 'true' : 'false'} data-side={side} inert={!open}>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" data-testid="drawer-backdrop" />
      <div
        ref={panelRef}
        id={id}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>{title}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label={`Close ${title.toLowerCase()}`}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
            </svg>
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  )
}
