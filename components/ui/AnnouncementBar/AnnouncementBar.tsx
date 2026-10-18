'use client'

import Link from 'next/link'
import { useState } from 'react'
import styles from './AnnouncementBar.module.css'

export interface AnnouncementBarProps {
  messages: string[]
  href?: string
}

/**
 * How often the message set is repeated in each half of the track. The loop
 * animation slides the track by half its width, so a half must be at least as
 * wide as the viewport or the bar runs empty for a moment before the next
 * copy arrives. Three messages are about 1200px; four repeats cover 4K.
 */
export const LOOP_REPEAT = 4

/**
 * Fixed-height USP strip. The messages scroll as a seamless loop: one readable
 * copy, then aria-hidden repeats that fill the track past any viewport width.
 * A pause button keeps it WCAG 2.2.2 compliant, and under reduced motion
 * tokens.css stops it entirely.
 */
export default function AnnouncementBar({ messages, href }: AnnouncementBarProps) {
  const [paused, setPaused] = useState(false)
  if (messages.length === 0) return null

  const copies = Array.from({ length: LOOP_REPEAT * 2 }, (_, i) => i)
  const track = (
    <ul className={styles.track} data-announcement-track="" data-paused={paused ? 'true' : 'false'}>
      {copies.map((copy) =>
        messages.map((m) => (
          <li key={`${copy}-${m}`} className={styles.item} aria-hidden={copy === 0 ? undefined : 'true'}>
            {m}
          </li>
        ))
      )}
    </ul>
  )

  return (
    <aside className={styles.bar} aria-label="Announcements">
      <div className={styles.viewport}>
        {href ? <Link href={href} className={styles.link}>{track}</Link> : track}
      </div>
      <button
        type="button"
        className={styles.pause}
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        aria-label="Pause announcements"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          {paused ? <path d="M2 1l7 4-7 4z" fill="currentColor" /> : <path d="M2 1h2v8H2zM6 1h2v8H6z" fill="currentColor" />}
        </svg>
      </button>
    </aside>
  )
}
