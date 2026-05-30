'use client'

import { useEffect, useState } from 'react'
import { RELEASE_AT_UTC } from '@/lib/release'
import styles from './coming-soon.module.css'

function split(ms: number) {
  const s = Math.floor(Math.max(0, ms) / 1000)
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  }
}

export default function Countdown() {
  // Null until mounted so the server and first client render match (the time
  // is only known in the browser); the empty box reserves the layout space.
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => setRemaining(RELEASE_AT_UTC - Date.now())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  if (remaining === null) {
    return <div className={styles.countdown} aria-hidden="true" />
  }

  const t = split(remaining)
  const units: Array<[number, string]> = [
    [t.days, 'Days'],
    [t.hours, 'Hrs'],
    [t.minutes, 'Min'],
    [t.seconds, 'Sec'],
  ]

  return (
    <div className={styles.countdown} role="timer">
      {units.map(([value, label]) => (
        <div key={label} className={styles.unit}>
          <span className={styles.unitValue}>{String(value).padStart(2, '0')}</span>
          <span className={styles.unitLabel}>{label}</span>
        </div>
      ))}
    </div>
  )
}
