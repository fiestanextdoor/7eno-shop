import type { Metadata } from 'next'
import { LogoWordmark } from '@/components/Logo/Logo'
import { RELEASE_DATE_LABEL, RELEASE_TIME_LABEL } from '@/lib/release'
import Countdown from './Countdown'
import styles from './coming-soon.module.css'

export const metadata: Metadata = {
  title: '7ENO — Coming Soon',
  description: 'Divine Authority. Launching 19 June 2026.',
  robots: { index: false, follow: false },
}

export default function ComingSoonPage() {
  return (
    <main className={styles.page}>
      <div className={styles.videoWrap} aria-hidden="true">
        <iframe
          src="https://player.vimeo.com/video/1193664281?background=1&autoplay=1&loop=1&muted=1&playsinline=1"
          className={styles.video}
          allow="autoplay; fullscreen"
          title=""
        />
      </div>
      <div className={styles.overlay} />

      <section className={styles.content}>
        <div className={styles.logo}>
          <LogoWordmark variant="butter" height={64} align="center" priority />
        </div>

        <p className={styles.quote}>Immortality is not a gift. It is a refusal.</p>

        <h1 className={styles.heading}>
          Divine<br />Authority
        </h1>

        <div className={styles.release}>
          <span className={styles.releaseLabel}>Launching</span>
          <span className={styles.releaseDate}>
            {RELEASE_DATE_LABEL} &middot; {RELEASE_TIME_LABEL}
          </span>
          <Countdown />
        </div>
      </section>
    </main>
  )
}
