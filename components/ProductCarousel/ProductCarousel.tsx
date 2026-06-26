import type { Provider } from '@/types/catalog'
import QuickAddCard from './QuickAddCard'
import styles from './ProductCarousel.module.css'

export interface CarouselColor {
  color: string
  hex: string
  displayName: string
}

export interface CarouselVariant {
  id: string
  color: string
  size: string
  name: string
  priceCents: number
  inStock: boolean
}

export interface CarouselItem {
  slug: string
  name: string
  image: string | null
  provider: Provider
  productId: string
  currency: string
  colors: CarouselColor[]
  variants: CarouselVariant[]
}

interface ProductCarouselProps {
  items: CarouselItem[]
}

/**
 * A horizontally scrollable belt of product cards. There is no auto-scroll: the
 * row is dragged/scrolled by hand and always shows a visible horizontal scrollbar
 * so the affordance is obvious. Cards snap as you scroll for a tidy resting state.
 * Each card carries a quick-add control (see QuickAddCard).
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
            <QuickAddCard item={item} />
          </li>
        ))}
      </ul>
    </div>
  )
}
