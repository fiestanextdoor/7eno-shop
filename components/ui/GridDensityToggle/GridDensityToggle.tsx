'use client'

import { useRef, type KeyboardEvent } from 'react'
import styles from './GridDensityToggle.module.css'

export interface GridDensityToggleProps {
  value: number
  options: number[]
  onChange(value: number): void
  label?: string
}

function DensityIcon({ columns }: { columns: number }) {
  const size = 16
  const gap = 2
  const width = (size - gap * (columns - 1)) / columns
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {Array.from({ length: columns }, (_, i) => (
        <rect key={i} x={i * (width + gap)} y="0" width={width} height={size} fill="currentColor" />
      ))}
    </svg>
  )
}

/** Products per row as a radio group: one tab stop, arrows move the choice. */
export default function GridDensityToggle({ value, options, onChange, label = 'Products per row' }: GridDensityToggleProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const activeIndex = Math.max(0, options.indexOf(value))

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1
      : 0
    if (step === 0) return
    event.preventDefault()
    const next = (index + step + options.length) % options.length
    onChange(options[next])
    refs.current[next]?.focus()
  }

  return (
    <div role="radiogroup" aria-label={label} className={styles.toggle}>
      {options.map((option, i) => (
        <button
          key={option}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="button"
          role="radio"
          aria-checked={option === value}
          aria-label={`${option} per row`}
          tabIndex={i === activeIndex ? 0 : -1}
          className={styles.option}
          onClick={() => onChange(option)}
          onKeyDown={(event) => onKeyDown(event, i)}
        >
          <DensityIcon columns={option} />
        </button>
      ))}
    </div>
  )
}
