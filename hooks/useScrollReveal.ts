'use client'

import { useEffect } from 'react'

/**
 * Scroll animations for every element with a data-reveal attribute, driven
 * by GSAP ScrollTrigger. Each page sets the attribute in its markup; this
 * hook (mounted once in AppShell, re-run per route) wires them up:
 *
 *   hero     fades and lifts the element's children in on load (above the fold)
 *   up       fades and lifts the element in when it scrolls into view
 *   title    big headline: lifts in with a slight tilt
 *   media    image or video frame: scales in, then the picture drifts (parallax) while scrolling
 *   stagger  the element's children come in one after another
 *
 * Reduced motion: nothing is registered, content is simply there. GSAP is
 * loaded on demand so the server bundle and tests never see it.
 */
export type RevealKind = 'hero' | 'up' | 'title' | 'media' | 'stagger'

export const REVEAL_QUERY = '(prefers-reduced-motion: no-preference)'

export function useScrollReveal(routeKey: string): void {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    if (!window.matchMedia(REVEAL_QUERY).matches) return

    let cancelled = false
    let context: { revert(): void } | undefined

    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
      if (cancelled) return
      gsap.registerPlugin(ScrollTrigger)

      context = gsap.context(() => {
        const elements = gsap.utils.toArray<HTMLElement>('[data-reveal]')
        for (const el of elements) {
          const kind = el.dataset.reveal as RevealKind
          const once = { trigger: el, start: 'top 88%', once: true }
          switch (kind) {
            case 'hero': {
              // A single wrapper child (DropBlock in the hero): stagger its lines instead.
              const targets = el.children.length === 1 && el.children[0].children.length > 1 ? el.children[0].children : el.children
              gsap.from(targets, { autoAlpha: 0, y: 36, duration: 1, stagger: 0.09, ease: 'power3.out', delay: 0.1 })
              break
            }
            case 'up':
              gsap.from(el, { autoAlpha: 0, y: 48, duration: 0.9, ease: 'power3.out', scrollTrigger: once })
              break
            case 'title':
              gsap.from(el, { autoAlpha: 0, y: 72, rotate: -1.5, transformOrigin: 'left bottom', duration: 1.1, ease: 'expo.out', scrollTrigger: once })
              break
            case 'media': {
              gsap.from(el, { autoAlpha: 0, scale: 0.92, duration: 1.1, ease: 'power3.out', scrollTrigger: { ...once, start: 'top 90%' } })
              const picture = el.querySelector('img, video')
              if (picture) {
                gsap.fromTo(
                  picture,
                  { yPercent: -5 },
                  { yPercent: 5, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.6 } }
                )
              }
              break
            }
            case 'stagger':
              gsap.from(el.children, { autoAlpha: 0, y: 40, duration: 0.8, stagger: 0.07, ease: 'power3.out', scrollTrigger: { ...once, start: 'top 85%' } })
              break
          }
        }
        // Images that load after mount move the layout; measure again then.
        ScrollTrigger.refresh()
      })
    })()

    return () => {
      cancelled = true
      context?.revert()
    }
  }, [routeKey])
}
