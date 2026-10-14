'use client'

import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import styles from './SizeSelector.module.css'

export interface SizeOption {
  /** Stable value, e.g. the variant id. */
  value: string
  /** What the shopper reads: "M", "XL", "EU 42". */
  label: string
  /** Struck through but still selectable (spec section 5): picking it offers "Notify me". */
  soldOut: boolean
}

export interface SizeSelectorProps {
  sizes: SizeOption[]
  value: string | null
  onChange(value: string): void
  /** Group label and accessible name. Defaults to "Size". */
  label?: string
  /** Extra content at the end of the label row, e.g. the size guide button. */
  aside?: ReactNode
  /** Put on the radio group; the sticky buy bar jumps to it. */
  id?: string
}

const NEXT_KEYS = new Set(['ArrowRight', 'ArrowDown'])
const PREV_KEYS = new Set(['ArrowLeft', 'ArrowUp'])

/**
 * Sizes as text in a radio group (WAI-ARIA radio pattern): one tab stop,
 * arrow keys move and select with wrap-around, Home and End jump.
 */
export default function SizeSelector({ sizes, value, onChange, label = 'Size', aside, id }: SizeSelectorProps) {
  const labelId = useId()
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  if (sizes.length === 0) return null

  const checkedIndex = sizes.findIndex((s) => s.value === value)
  const tabStop = checkedIndex === -1 ? 0 : checkedIndex
  const selected = checkedIndex === -1 ? null : sizes[checkedIndex]

  function move(to: number) {
    const index = (to + sizes.length) % sizes.length
    onChange(sizes[index].value)
    refs.current[index]?.focus()
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (NEXT_KEYS.has(event.key)) move(index + 1)
    else if (PREV_KEYS.has(event.key)) move(index - 1)
    else if (event.key === 'Home') move(0)
    else if (event.key === 'End') move(sizes.length - 1)
    else return
    event.preventDefault()
  }

  return (
    <div className={styles.selector}>
      <div className={styles.head}>
        <span id={labelId} className={styles.label}>{label}</span>
        {selected && (
          <span className={styles.value}>
            {selected.soldOut ? `${selected.label}, sold out` : selected.label}
          </span>
        )}
        {aside && <span className={styles.aside}>{aside}</span>}
      </div>
      <div id={id} role="radiogroup" aria-labelledby={labelId} className={styles.options}>
        {sizes.map((size, i) => (
          <button
            key={size.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={size.value === value}
            tabIndex={i === tabStop ? 0 : -1}
            className={styles.option}
            data-sold-out={size.soldOut ? 'true' : undefined}
            onClick={() => onChange(size.value)}
            onKeyDown={(event) => onKeyDown(event, i)}
          >
            {size.label}
            {size.soldOut && <span className={styles.srOnly}> (sold out)</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
