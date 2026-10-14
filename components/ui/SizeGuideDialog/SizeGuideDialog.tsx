'use client'

import { useId, useRef, useState, type KeyboardEvent, type MouseEvent, type SyntheticEvent } from 'react'
import { useScrollLock } from '@/hooks/useFocusTrap'
import type { SizeGuide } from '@/lib/printful'
import styles from './SizeGuideDialog.module.css'

export interface SizeGuideDialogProps {
  /** "Hoodies": the dialog title reads "Hoodies size guide". */
  category: string
  guide: SizeGuide
  modelNote?: string
  /** Display label per size, e.g. EU sizes for footwear. */
  sizeLabels?: Record<string, string>
}

/**
 * A "Size guide" button and a native <dialog> with the Printful size table.
 * The native modal gives focus containment, Esc and focus return; browsers
 * without showModal (and jsdom) get the open attribute plus the same Esc and
 * focus-return handling here.
 */
export default function SizeGuideDialog({ category, guide, modelNote, sizeLabels = {} }: SizeGuideDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const [isOpen, setIsOpen] = useState(false)
  useScrollLock(isOpen)
  const isEmpty = guide.rows.length === 0 || guide.sizes.length === 0

  function open() {
    const dialog = dialogRef.current
    if (!dialog || dialog.hasAttribute('open')) return
    if (typeof dialog.showModal === 'function') dialog.showModal()
    else dialog.setAttribute('open', '')
    setIsOpen(true)
  }

  function close() {
    const dialog = dialogRef.current
    if (!dialog || !dialog.hasAttribute('open')) return
    setIsOpen(false)
    if (typeof dialog.close === 'function') {
      dialog.close()
    } else {
      dialog.removeAttribute('open')
      triggerRef.current?.focus()
    }
  }

  function onCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault()
    close()
  }

  function onKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Escape') return
    event.preventDefault()
    close()
  }

  // Keeps the scroll lock in sync when the native dialog closes by other means.
  function onClose() {
    setIsOpen(false)
  }

  function onBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    // The inner wrapper fills the dialog box, so only a click on the
    // backdrop targets the dialog element itself.
    if (event.target === event.currentTarget) close()
  }

  return (
    <>
      <button ref={triggerRef} type="button" className={styles.trigger} onClick={open} aria-haspopup="dialog">
        Size guide
      </button>
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby={titleId}
        onCancel={onCancel}
        onKeyDown={onKeyDown}
        onClick={onBackdropClick}
        onClose={onClose}
      >
        <div className={styles.inner}>
          <div className={styles.head}>
            <h2 id={titleId} className={styles.title}>{category} size guide</h2>
            <button type="button" className={styles.close} onClick={close} aria-label="Close size guide">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
              </svg>
            </button>
          </div>
          {isEmpty ? (
            <p className={styles.empty}>No size guide available for this product.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <caption className={styles.caption}>Body measurements in {guide.unit}</caption>
                <thead>
                  <tr>
                    <th scope="col">Size</th>
                    {guide.sizes.map((size) => (
                      <th key={size} scope="col">{sizeLabels[size] ?? size}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {guide.rows.map((row, i) => (
                    <tr key={`${row.label}-${i}`}>
                      <th scope="row">{row.label}</th>
                      {guide.sizes.map((size) => (
                        <td key={size}>{row.values[size] || '-'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {modelNote && <p className={styles.note}>{modelNote}</p>}
        </div>
      </dialog>
    </>
  )
}
