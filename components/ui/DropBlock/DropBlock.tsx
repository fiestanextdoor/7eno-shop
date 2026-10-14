import Link from 'next/link'
import Badge from '@/components/ui/Badge/Badge'
import { buttonClasses } from '@/components/ui/Button/Button'
import Countdown from '@/components/ui/Countdown/Countdown'
import WaitlistForm from '@/components/ui/WaitlistForm/WaitlistForm'
import { NEW_IN_MS, type DropView } from '@/lib/drops'
import styles from './DropBlock.module.css'

export interface DropBlockProps {
  drop: DropView
  /** Server time of this render, for the New in badge. */
  now: number
  /** h1 on a landing whose main subject is the drop. */
  as?: 'h1' | 'h2'
  withIntro?: boolean
  /** Hide "Shop the drop" on the collection page itself. */
  withLink?: boolean
}

/** Edition, title and the drop state: countdown and waitlist, or Live now. */
export default function DropBlock({ drop, now, as: Heading = 'h2', withIntro = false, withLink = true }: DropBlockProps) {
  const titleId = `drop-${drop.id}-title`
  const isNew = drop.status === 'live' && now - Date.parse(drop.startsAt) < NEW_IN_MS

  return (
    <section className={styles.block} data-tone={drop.tone} aria-labelledby={titleId}>
      <div className={styles.inner}>
        <p className={styles.edition}>{drop.editionLabel}</p>
        <Heading id={titleId} className={styles.title}>{drop.title}</Heading>
        {withIntro && <p className={styles.intro}>{drop.intro}</p>}

        {drop.status === 'upcoming' && (
          <div className={styles.state}>
            <p className={styles.teaser}>Something is coming.</p>
            <Countdown target={drop.startsAt} label={drop.startsAtLabel} />
            {drop.waitlist && <WaitlistForm dropId={drop.id} />}
          </div>
        )}

        {drop.status === 'live' && (
          <div className={styles.state}>
            <p className={styles.live}>
              <span className={styles.dot} aria-hidden="true" />
              Live now
              {isNew && <Badge kind="new" />}
            </p>
            {withLink && (
              <Link href={drop.href} className={buttonClasses('accent', 'lg')}>
                Shop the drop
              </Link>
            )}
          </div>
        )}

        {drop.status === 'closed' && (
          <p className={styles.closed}>Released {drop.startsOnLabel}. This edition is closed.</p>
        )}
      </div>
    </section>
  )
}
