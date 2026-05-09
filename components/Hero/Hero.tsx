// components/Hero/Hero.tsx
import Image from 'next/image'
import Link from 'next/link'
import WaveBars from '@/components/WaveBars/WaveBars'
import styles from './Hero.module.css'

interface HeroProps {
  productName?: string | null
  productImage?: string | null
}

export default function Hero({ productName, productImage }: HeroProps) {
  return (
    <section className={styles.hero}>
      <div className={styles.leftPanel} />

      <div className={styles.imagePanel}>
        {productImage ? (
          <Image
            src={productImage}
            alt={productName ?? '7ENO collection'}
            fill
            className={styles.productImage}
            priority
            sizes="(max-width: 640px) 100vw, 72vw"
          />
        ) : (
          <div className={styles.imageFallback} />
        )}

        <div className={styles.overlay} />

        <div className={styles.toggles}>
          <Link href="/shop?gender=men" className={styles.toggleBtn}>Men</Link>
          <div className={styles.divider} />
          <Link href="/shop?gender=women" className={styles.toggleBtn}>Women</Link>
        </div>

        <div className={styles.bottomBar}>
          <div className={styles.productMeta}>
            {productName && (
              <p className={styles.productName}>{productName}</p>
            )}
          </div>
          <WaveBars color="#F6F3EC" scale={1.2} />
        </div>
      </div>
    </section>
  )
}
