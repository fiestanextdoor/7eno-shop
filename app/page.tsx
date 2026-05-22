import type { Metadata } from 'next'
import Image from 'next/image'
import styles from './coming-soon.module.css'

export const metadata: Metadata = {
  title: '7ENO — Coming Soon',
  description: 'Divine Authority. Coming June 12th.',
}

export default function ComingSoonPage() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.videoWrap}>
        <iframe
          src="https://player.vimeo.com/video/1193664281?background=1&autoplay=1&loop=1&muted=1&quality=1080p"
          allow="autoplay; fullscreen"
          title="background"
        />
      </div>
      <div className={styles.overlay} />
      <div className={styles.content}>
        <Image
          src="/logos/woordmerk-butter.png"
          alt="7ENO"
          width={300}
          height={86}
          priority
          className={styles.logo}
        />
        <p className={styles.quote}>Immortality is not a gift. It is a refusal</p>
        <h1 className={styles.heading}>Divine<br />Authority</h1>
        <p className={styles.date}>Coming June 12th &nbsp;·&nbsp; 19:00</p>
      </div>
    </div>
  )
}
