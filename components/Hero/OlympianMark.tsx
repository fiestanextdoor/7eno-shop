'use client'

import { useEffect, useRef } from 'react'
import styles from './Hero.module.css'

// The four Olympian '26 brand colours. The hero wordmark is rendered in one of
// them, re-picked on every full reload so the mark greets you in a different
// colour each visit (mirrors the four-colour logo lock-up in the stylescape).
const OLY_COLORS = ['#b57446', '#297d95', '#eddca2', '#eda5b2']

export default function OlympianMark() {
  const markRef = useRef<HTMLSpanElement>(null)

  // The CSS gives the mark a teal default (matches SSR + no-JS). On mount we set
  // a fresh colour straight on the DOM node — a plain external-system update, no
  // React state — that differs from the previous load (kept in sessionStorage).
  useEffect(() => {
    let prev = -1
    try { prev = Number(sessionStorage.getItem('olyHeroColor')) } catch {}
    let next = Math.floor(Math.random() * OLY_COLORS.length)
    if (next === prev) next = (next + 1) % OLY_COLORS.length
    try { sessionStorage.setItem('olyHeroColor', String(next)) } catch {}
    if (markRef.current) markRef.current.style.backgroundColor = OLY_COLORS[next]
  }, [])

  return (
    <h1 className={styles.olympianHeading}>
      <span ref={markRef} className={styles.olympianMark} aria-hidden="true" />
      <span className={styles.srOnly}>Olympian</span>
    </h1>
  )
}
