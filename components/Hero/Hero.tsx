import Link from 'next/link'
import { Keraunos, SevenWordmark } from '@/components/Logo/Logo'
import styles from './Hero.module.css'

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.keraunos}>
        <Keraunos fg="#F6F3EC" width={120} />
      </div>
      <div className={styles.wordmark}>
        <SevenWordmark fg="#F6F3EC" height={72} />
      </div>
      <p className={styles.tagline}>Divine Authority</p>
      <Link href="/shop" className={styles.cta}>Shop the Collection</Link>
    </section>
  )
}
