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
          src="/logos/woordmerk-wit.png"
          alt="7ENO"
          width={260}
          height={104}
          priority
          className={styles.logo}
        />
        <h1 className={styles.heading}>Divine<br />Authority</h1>
        <p className={styles.date}>Coming June 12th</p>
      </div>
    </div>
  )
}
