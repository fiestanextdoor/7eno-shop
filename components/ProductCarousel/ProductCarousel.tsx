import Image from 'next/image'
import Link from 'next/link'
import styles from './ProductCarousel.module.css'

export interface CarouselItem {
  slug: string
  name: string
  image: string | null
}

interface ProductCarouselProps {
  items: CarouselItem[]
}

/**
 * An auto-scrolling belt of every product, in the (already shuffled) order it is
 * passed. The track is duplicated once so the loop is seamless; it pauses on
 * hover/focus so a card can be clicked, and reduced-motion users get a static,
 * horizontally scrollable row instead of the animation.
 */
export default function ProductCarousel({ items }: ProductCarouselProps) {
  if (items.length === 0) return null

  // Duplicate the list so translateX(-50%) lands exactly on the start of the
  // second copy → no visible jump when the animation repeats.
  const loop = [...items, ...items]
  // Constant scroll speed regardless of how many products there are.
  const duration = `${Math.max(items.length * 5, 24)}s`

  return (
    <div className={styles.viewport}>
      <ul className={styles.track} style={{ animationDuration: duration }}>
        {loop.map((item, i) => {
          const isClone = i >= items.length
          return (
            <li
              key={`${item.slug}-${i}`}
              className={styles.slide}
              aria-hidden={isClone ? true : undefined}
            >
              <Link
                href={`/shop/${item.slug}`}
                className={styles.card}
                tabIndex={isClone ? -1 : undefined}
              >
                <div className={styles.imageWrap}>
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className={styles.image}
                      sizes="(max-width: 640px) 60vw, 280px"
                    />
                  ) : (
                    <div className={styles.placeholder} />
                  )}
                </div>
                <span className={styles.name}>{item.name}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
