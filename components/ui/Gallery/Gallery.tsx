'use client'

import Image from 'next/image'
import { useRef, useState, type UIEvent } from 'react'
import type { GalleryImage } from '@/lib/product-gallery'
import styles from './Gallery.module.css'

export interface GalleryProps {
  images: GalleryImage[]
  /** Product name, used for the region and the empty state. */
  label: string
}

function scrollBehavior(): ScrollBehavior {
  const reduce =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return reduce ? 'auto' : 'smooth'
}

/**
 * Desktop: images stacked, sticky thumbnails that scroll to an image.
 * Mobile: a horizontal scroll-snap strip with a counter. Mockups sit on the
 * white surface at 4:5 with object-fit: contain (spec section 2).
 */
export default function Gallery({ images, label }: GalleryProps) {
  const [active, setActive] = useState(0)
  const slides = useRef<(HTMLLIElement | null)[]>([])

  if (images.length === 0) {
    return <div className={styles.placeholder} role="img" aria-label={`${label}, no image yet`} />
  }

  function show(index: number) {
    setActive(index)
    slides.current[index]?.scrollIntoView?.({ behavior: scrollBehavior(), block: 'start', inline: 'start' })
  }

  function onTrackScroll(event: UIEvent<HTMLUListElement>) {
    const track = event.currentTarget
    if (track.clientWidth === 0) return
    const index = Math.round(track.scrollLeft / track.clientWidth)
    if (index >= 0 && index < images.length && index !== active) setActive(index)
  }

  return (
    <section className={styles.gallery} aria-label={`${label} images`}>
      {images.length > 1 && (
        <ol className={styles.thumbs}>
          {images.map((image, i) => (
            <li key={image.src}>
              <button
                type="button"
                className={styles.thumb}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-current={i === active ? 'true' : undefined}
                onClick={() => show(i)}
              >
                <Image src={image.src} alt="" fill sizes="72px" className={styles.thumbImage} />
              </button>
            </li>
          ))}
        </ol>
      )}
      <ul
        className={styles.track}
        onScroll={onTrackScroll}
        tabIndex={0}
        aria-label={`${label} images, swipe for more`}
      >
        {images.map((image, i) => (
          <li
            key={image.src}
            ref={(el) => {
              slides.current[i] = el
            }}
            className={styles.slide}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(min-width: 1024px) 55vw, 100vw"
              className={styles.image}
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : undefined}
            />
          </li>
        ))}
      </ul>
      {images.length > 1 && (
        <p className={styles.counter} aria-hidden="true">
          {active + 1} / {images.length}
        </p>
      )}
    </section>
  )
}
