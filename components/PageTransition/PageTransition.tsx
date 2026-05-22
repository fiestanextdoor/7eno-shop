'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'

const STAY   = 900
const OUT_MS = 500

export default function PageTransition() {
  const pathname   = usePathname()
  const prevPath   = useRef(pathname)
  const overlayRef = useRef<HTMLDivElement>(null)
  const sevenRef   = useRef<HTMLImageElement>(null)
  const bliksemRef = useRef<HTMLImageElement>(null)
  const flashRef   = useRef<HTMLDivElement>(null)
  const logoRef    = useRef<HTMLImageElement>(null)
  const navigating = useRef(false)
  const hideTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timers     = useRef<ReturnType<typeof setTimeout>[]>([])

  const later = (ms: number, fn: () => void) => {
    const t = setTimeout(fn, ms)
    timers.current.push(t)
  }

  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  const show = useCallback(() => {
    const el      = overlayRef.current
    const seven   = sevenRef.current
    const bliksem = bliksemRef.current
    const flash   = flashRef.current
    const logo    = logoRef.current
    if (!el || !seven || !bliksem || !flash || !logo) return

    clearTimers()
    if (hideTimer.current) clearTimeout(hideTimer.current)

    // Reset — instant, geen transitie
    el.style.transition      = 'none'
    el.style.opacity         = '1'
    el.style.pointerEvents   = 'all'

    seven.style.transition   = 'none'
    seven.style.opacity      = '0'

    bliksem.style.transition = 'none'
    bliksem.style.opacity    = '0'
    bliksem.style.transform  = 'translateY(-80px) scaleY(0.6)'

    flash.style.transition   = 'none'
    flash.style.opacity      = '0'

    logo.style.transition    = 'none'
    logo.style.opacity       = '0'

    // prefers-reduced-motion: skip animatie, toon direct het logo
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      logo.style.opacity = '1'
      return
    }

    // t=60ms — 7 verschijnt
    later(60, () => {
      if (!sevenRef.current) return
      sevenRef.current.style.transition = 'opacity 0.18s ease'
      sevenRef.current.style.opacity    = '1'
    })

    // t=280ms — bliksem zichtbaar boven de 7
    later(280, () => {
      if (!bliksemRef.current) return
      bliksemRef.current.style.opacity = '1'
    })

    // t=360ms — bliksem slaat in (snel naar beneden)
    later(360, () => {
      if (!bliksemRef.current) return
      bliksemRef.current.style.transition = 'transform 0.07s cubic-bezier(0.4, 0, 1, 1)'
      bliksemRef.current.style.transform  = 'translateY(0) scaleY(1)'
    })

    // t=430ms — inslag: witte flash
    later(430, () => {
      if (!flashRef.current) return
      flashRef.current.style.transition = 'none'
      flashRef.current.style.opacity    = '1'
    })

    // t=490ms — flash wegfaden + 7 en bliksem verdwijnen
    later(490, () => {
      if (!flashRef.current || !sevenRef.current || !bliksemRef.current) return
      flashRef.current.style.transition  = 'opacity 0.25s ease'
      flashRef.current.style.opacity     = '0'
      sevenRef.current.style.transition  = 'opacity 0.1s ease'
      sevenRef.current.style.opacity     = '0'
      bliksemRef.current.style.transition = 'opacity 0.1s ease'
      bliksemRef.current.style.opacity   = '0'
    })

    // t=560ms — logo verschijnt
    later(560, () => {
      if (!logoRef.current) return
      logoRef.current.style.transition = 'opacity 0.3s ease, transform 0.3s ease'
      logoRef.current.style.opacity    = '1'
    })
  }, [])

  const hide = useCallback(() => {
    const el = overlayRef.current
    if (!el) return
    clearTimers()
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
      {/* Flash overlay — wit vlak bij inslag */}
      <div
        ref={flashRef}
        style={{
          position:   'absolute',
          inset:      0,
          background: 'rgba(255,255,255,0.85)',
          opacity:    0,
          zIndex:     1,
          pointerEvents: 'none',
        }}
      />

      {/* Animatie-container: bliksem boven, 7 eronder */}
      <div style={{ position: 'relative', width: 100, height: 200, zIndex: 2 }}>
        {/* Bliksem — start boven de 7 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={bliksemRef}
          src="/logos/bliksem-butter.png"
          alt=""
          style={{
            position:  'absolute',
            top:       0,
            left:      '50%',
            transform: 'translateX(-50%) translateY(-80px) scaleY(0.6)',
            width:     52,
            objectFit: 'contain',
            opacity:   0,
            willChange: 'transform, opacity',
          }}
        />

        {/* De 7 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={sevenRef}
          src="/logos/7-butter.png"
          alt=""
          style={{
            position:  'absolute',
            bottom:    0,
            left:      '50%',
            transform: 'translateX(-50%)',
            width:     80,
            objectFit: 'contain',
            opacity:   0,
            willChange: 'opacity',
          }}
        />
      </div>

      {/* Beeldmerk — verschijnt na inslag */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={logoRef}
        src="/logos/beeldmerk-wit.png"
        alt=""
        style={{
          position:  'absolute',
          width:     130,
          objectFit: 'contain',
          opacity:   0,
          zIndex:    2,
          willChange: 'opacity',
        }}
      />
    </div>
  )
}
