'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { formatDropDate } from '@/lib/drops'
import styles from './Countdown.module.css'

export interface CountdownProps {
  /** ISO 8601 with offset, e.g. "2026-11-01T12:00:00+01:00". */
  target: string
  /** The date as the server formatted it, so server and client render the same text. */
  label?: string
}

export function splitRemaining(ms: number): { days: number; hours: number; minutes: number; seconds: number } {
  const s = Math.floor(Math.max(0, ms) / 1000)
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

export default function Countdown({ target, label }: CountdownProps) {
  const router = useRouter()
  const targetMs = Date.parse(target)
  // Null on the server and in the first client render: the time is only
  // known in the browser, and the placeholders keep both renders equal.
  const [now, setNow] = useState<number | null>(null)
  const refreshed = useRef(false)

  useEffect(() => {
    const tick = () => setNow(Date.now())
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  const remaining = now === null ? null : targetMs - now
  const done = remaining !== null && remaining <= 0

  useEffect(() => {
    // The page was rendered before the release: fetch the live version once.
    if (done && !refreshed.current) {
      refreshed.current = true
      router.refresh()
    }
  }, [done, router])

  const parts = remaining === null ? null : splitRemaining(remaining)
  const units: [string, number | undefined][] = [
    ['Days', parts?.days],
    ['Hrs', parts?.hours],
    ['Min', parts?.minutes],
    ['Sec', parts?.seconds],
  ]

  return (
    <div className={styles.countdown}>
      <p className={styles.date}>
        Drops <time dateTime={target}>{label ?? formatDropDate(target)}</time>
      </p>
      <div className={styles.clock} aria-hidden="true">
        {units.map(([unit, value]) => (
          <div key={unit} className={styles.unit}>
            <span className={styles.value}>{value === undefined ? '--' : pad(value)}</span>
            <span className={styles.unitLabel}>{unit}</span>
          </div>
        ))}
      </div>
      {done && <p className={styles.live}>Live now</p>}
    </div>
  )
}
