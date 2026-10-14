'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import styles from './AutoplayVideo.module.css'

/** Autoplay only where it costs nothing: wide screens without reduced motion (spec section 2 and 9). */
export const AUTOPLAY_QUERY = '(min-width: 768px) and (prefers-reduced-motion: no-preference)'

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
  const query = window.matchMedia(AUTOPLAY_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function canAutoplay(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(AUTOPLAY_QUERY).matches
}

/** The server never autoplays: the poster is the first paint everywhere. */
function serverSnapshot(): boolean {
  return false
}

export interface AutoplayVideoProps {
  src: string
  poster: string
  label: string
  width: number
  height: number
}

export default function AutoplayVideo({ src, poster, label, width, height }: AutoplayVideoProps) {
  const ref = useRef<HTMLVideoElement>(null)
  const autoplay = useSyncExternalStore(subscribe, canAutoplay, serverSnapshot)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    if (!autoplay) {
      if (!video.paused) video.pause()
      return
    }
    // A browser may still refuse (data saver, low power): the poster stays.
    video.play()?.catch(() => undefined)
  }, [autoplay])

  return (
    <video
      ref={ref}
      className={styles.video}
      width={width}
      height={height}
      poster={poster}
      preload="none"
      muted
      loop
      playsInline
      controls={!autoplay}
      aria-label={label}
    >
      <source src={src} type="video/mp4" />
    </video>
  )
}
