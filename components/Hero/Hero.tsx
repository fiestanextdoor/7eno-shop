import Image from 'next/image'
import Link from 'next/link'
import styles from './Hero.module.css'

interface HeroProps {
  productName?: string | null
  productImage?: string | null
}

export default function Hero({ productImage }: HeroProps) {
  return (
    <section className={styles.hero}>
      {productImage && (
        <Image
          src={productImage}
          alt="7ENO collection"
          fill
          className={styles.image}
          priority
          sizes="100vw"
        />
      )}
      <div className={styles.overlay} />

      <div className={styles.content}>
        <p className={styles.label}>SS 2026 Collection</p>
        <h1 className={styles.heading}>
          Divine<br />Authority
        </h1>
        <div className={styles.rule} />
        <Link href="/shop" className={styles.cta}>
          Explore Collection
        </Link>
      </div>

      <div className={styles.scrollHint} aria-hidden="true">
        <span className={styles.scrollLabel}>Scroll</span>
        <div className={styles.scrollLine} />
      </div>
    </section>
  )
}
