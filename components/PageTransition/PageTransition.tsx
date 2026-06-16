'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'
import styles from './PageTransition.module.css'

const STAY   = 600
const OUT_MS = 400

export default function PageTransition() {
  const pathname   = usePathname()
  const prevPath   = useRef(pathname)
  const overlayRef = useRef<HTMLDivElement>(null)
  const markRef    = useRef<HTMLDivElement>(null)
  const navigating = useRef(false)
  const hideTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback(() => {
    const el   = overlayRef.current
    const mark = markRef.current
    if (!el || !mark) return

    if (hideTimer.current) clearTimeout(hideTimer.current)

    el.style.transition    = 'none'
    el.style.opacity       = '1'
    el.style.pointerEvents = 'all'

    // Restart the assembly animation on every navigation: drop the class,
    // force a reflow so the browser resets the keyframes, then re-add it.
    mark.classList.remove(styles.play)
    void mark.offsetWidth
    mark.classList.add(styles.play)
  }, [])

  const hide = useCallback(() => {
    const el = overlayRef.current
    if (!el) return
    el.style.pointerEvents = 'none'
    el.style.transition    = `opacity ${OUT_MS}ms ease`
    el.style.opacity       = '0'
  }, [])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href') ?? ''
      if (!href || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('#') || href.startsWith('tel')) return
      try {
        const newPath = new URL(href, window.location.origin).pathname
        if (newPath === prevPath.current) return
        navigating.current = true
        show()
      } catch {}
    }
    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [show])

  useEffect(() => {
    if (pathname === prevPath.current) return
    prevPath.current = pathname
    if (!navigating.current) return
    navigating.current = false
    hideTimer.current = setTimeout(hide, STAY)
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current) }
  }, [pathname, hide])

  /* eslint-disable @next/next/no-img-element */
  return (
    <div ref={overlayRef} aria-hidden="true" className={styles.overlay}>
      <div ref={markRef} className={styles.mark}>
        <img src="/logos/parts/7-bottom.png" alt="" className={`${styles.part} ${styles.partBottom}`} />
        <img src="/logos/parts/7-top.png"    alt="" className={`${styles.part} ${styles.partTop}`} />
        <img src="/logos/parts/bolt-fill.png" alt="" className={`${styles.part} ${styles.partBolt}`} />
        <img src="/logos/beeldmerk-wit.png"  alt="" className={styles.final} />
        <div className={styles.flash} />
      </div>
    </div>
  )
  /* eslint-enable @next/next/no-img-element */
}
