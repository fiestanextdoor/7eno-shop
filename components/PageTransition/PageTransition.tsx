'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'

const STAY   = 600
const OUT_MS = 400

export default function PageTransition() {
  const pathname   = usePathname()
  const prevPath   = useRef(pathname)
  const overlayRef = useRef<HTMLDivElement>(null)
  const logoRef    = useRef<HTMLImageElement>(null)
  const navigating = useRef(false)
  const hideTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback(() => {
    const el   = overlayRef.current
    const logo = logoRef.current
    if (!el || !logo) return

    if (hideTimer.current) clearTimeout(hideTimer.current)

    el.style.transition    = 'none'
    el.style.opacity       = '1'
    el.style.pointerEvents = 'all'
    logo.style.opacity     = '1'
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

  return (
    <div
      ref={overlayRef}
      aria-hidden="true"
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         9999,
        background:     'var(--oxblood)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        opacity:        0,
        pointerEvents:  'none',
        willChange:     'opacity',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={logoRef}
        src="/logos/beeldmerk-wit.png"
        alt=""
        style={{ width: 130, objectFit: 'contain', opacity: 1 }}
      />
    </div>
  )
}
