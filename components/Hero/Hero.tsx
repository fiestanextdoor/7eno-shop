import Image from 'next/image'
import Link from 'next/link'
import styles from './Hero.module.css'

export default function Hero() {
  return (
    <section className={styles.hero}>
      <Image
        src="/hero-model.png"
        alt="7ENO — Divine Authority"
        fill
        className={styles.image}
        priority
        sizes="100vw"
      />
      <div className={styles.overlay} />

      <div className={styles.content}>
        <p className={styles.label}>Immortality is not a gift. It is a refusal</p>
        <h1 className={styles.heading}>
          Divine<br />Authority
        </h1>
        <div className={styles.bars} aria-hidden="true">
          <span className={`${styles.bar} ${styles.barA}`} />
          <span className={`${styles.bar} ${styles.barB}`} />
          <span className={`${styles.bar} ${styles.barC}`} />
        </div>
        <div className={styles.buttons}>
          <Link href="/shop?gender=men" className={styles.btn}>
            Men
          </Link>
          <Link href="/shop?gender=women" className={styles.btn}>
            Women
          </Link>
        </div>
      </div>

      <div className={styles.scrollHint} aria-hidden="true">
        <span className={styles.scrollLabel}>Scroll</span>
        <div className={styles.scrollLine} />
      </div>
    </section>
  )
}
