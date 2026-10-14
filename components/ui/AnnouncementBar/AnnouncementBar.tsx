'use client'

import Link from 'next/link'
import { useState } from 'react'
import styles from './AnnouncementBar.module.css'

export interface AnnouncementBarProps {
  messages: string[]
  href?: string
}

/**
 * Fixed-height USP strip. The messages scroll as a seamless loop (a second,
 * aria-hidden copy follows the first); a pause button keeps it WCAG 2.2.2
 * compliant, and under reduced motion tokens.css stops it entirely.
 */
export default function AnnouncementBar({ messages, href }: AnnouncementBarProps) {
  const [paused, setPaused] = useState(false)
  if (messages.length === 0) return null

  const track = (
    <ul className={styles.track} data-announcement-track="" data-paused={paused ? 'true' : 'false'}>
      {messages.map((m) => (
        <li key={m} className={styles.item}>{m}</li>
      ))}
      {messages.map((m) => (
        <li key={`loop-${m}`} className={styles.item} aria-hidden="true">{m}</li>
      ))}
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
