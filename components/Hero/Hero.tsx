import Link from 'next/link'
import styles from './Hero.module.css'

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.videoWrap} aria-hidden="true">
        <iframe
          src="https://player.vimeo.com/video/1193664281?background=1&autoplay=1&loop=1&muted=1&playsinline=1"
          className={styles.video}
          allow="autoplay; fullscreen"
          title=""
        />
      </div>
      <div className={styles.overlay} />

      <div className={styles.content}>
        <p className={styles.label}>Immortality is not a gift. It is a refusal</p>
        <h1 className={styles.heading}>
          Divine<br />Authority
        </h1>
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
