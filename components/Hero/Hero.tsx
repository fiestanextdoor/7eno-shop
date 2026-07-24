import Link from 'next/link'
import OlympianMark from './OlympianMark'
import styles from './Hero.module.css'

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.videoWrap} aria-hidden="true">
        {/* poster paints immediately so the hero has a real Largest Contentful
            Paint instead of waiting on the trailer; preload="metadata" keeps the
            initial download small (the clip itself is several MB) while autoplay
            still starts it. Both are Core Web Vitals wins, which Search uses as
            a ranking signal. */}
        <video
          className={styles.video}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/olympian/hero-poster.jpg"
        >
          <source src="/olympian-trailer.mp4" type="video/mp4" />
        </video>
      </div>
      <div className={styles.overlay} />

      <div className={styles.content}>
        <p className={styles.label}>Endure trials, Become legend</p>
        <OlympianMark />
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
