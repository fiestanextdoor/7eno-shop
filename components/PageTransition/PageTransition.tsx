'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'

const STAY   = 700   // ms zichtbaar na pagina geladen
const OUT_MS = 500   // ms exit animatie

export default function PageTransition() {
  const pathname    = usePathname()
  const prevPath    = useRef(pathname)
  const overlayRef  = useRef<HTMLDivElement>(null)
  const logoRef     = useRef<HTMLImageElement>(null)
  const navigating  = useRef(false)
  const hideTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback(() => {
    const el   = overlayRef.current
    const logo = logoRef.current
    if (!el || !logo) return

    if (hideTimer.current) clearTimeout(hideTimer.current)

    // Hard snap — geen animatie, instant zichtbaar
    el.style.transition = 'none'
    el.style.opacity    = '1'
    el.style.transform  = 'translateY(0%)'
    el.style.pointerEvents = 'all'

    logo.style.transition = 'none'
    logo.style.opacity    = '0'
    logo.style.transform  = 'translateY(12px)'

    // Logo na 250ms infaden
    setTimeout(() => {
      if (!logoRef.current) return
      logoRef.current.style.transition = 'opacity 0.3s ease, transform 0.3s ease'
      logoRef.current.style.opacity    = '1'
      logoRef.current.style.transform  = 'translateY(0)'
    }, 250)
  }, [])

  const hide = useCallback(() => {
    const el   = overlayRef.current
    const logo = logoRef.current
    if (!el) return

    if (logo) logo.style.opacity = '0'
    el.style.pointerEvents = 'none'
    el.style.transition    = `opacity ${OUT_MS}ms ease, transform ${OUT_MS}ms ease`
    el.style.opacity       = '0'
    el.style.transform     = 'translateY(-30px)'
  }, [])

  // Intercept klikken VOOR Next.js (capture phase)
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

  // Pathname veranderd = pagina geladen → start exit timer
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
        position:      'fixed',
        inset:         0,
        zIndex:        9999,
        background:    'var(--oxblood)',
        display:       'flex',
        alignItems:    'center',
        justifyContent:'center',
        opacity:        0,
        transform:     'translateY(0%)',
        pointerEvents: 'none',
        willChange:    'opacity, transform',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={logoRef}
        src="/logos/beeldmerk-wit.png"
        alt=""
        style={{
          width:      140,
          height:     140,
          objectFit:  'contain',
          opacity:    0,
          transform:  'translateY(12px)',
          willChange: 'opacity, transform',
        }}
      />
    </div>
  )
}
