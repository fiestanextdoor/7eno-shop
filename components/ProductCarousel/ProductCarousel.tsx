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
 * A horizontally scrollable belt of product cards. There is no auto-scroll: the
 * row is dragged/scrolled by hand and always shows a visible horizontal scrollbar
 * so the affordance is obvious. Cards snap as you scroll for a tidy resting state.
 */
export default function ProductCarousel({ items }: ProductCarouselProps) {
  if (items.length === 0) return null

  return (
    <div
      className={styles.viewport}
      role="region"
      aria-label="Latest products, scroll horizontally"
      tabIndex={0}
    >
      <ul className={styles.track}>
        {items.map((item, i) => (
          <li key={`${item.slug}-${i}`} className={styles.slide}>
            <Link href={`/shop/${item.slug}`} className={styles.card}>
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
        ))}
      </ul>
    </div>
  )
}
