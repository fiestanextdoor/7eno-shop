import Image from 'next/image'
import Link from 'next/link'
import Badge from '@/components/ui/Badge/Badge'
import type { DropView } from '@/lib/drops'
import styles from './EditionCard.module.css'

function windowLabel(drop: DropView): string {
  if (drop.status === 'upcoming') return `Drops ${drop.startsAtLabel}`
  if (drop.status === 'closed') return `Released ${drop.startsOnLabel}, now closed`
  return `Released ${drop.startsOnLabel}`
}

/** One archive row: edition, title, window, status and an image strip. */
export default function EditionCard({ drop }: { drop: DropView }) {
  return (
    <article className={styles.card} data-tone={drop.tone}>
      <Link href={drop.href} className={styles.link}>
        <div className={styles.head}>
          <Badge kind="edition">{drop.editionLabel}</Badge>
          <h2 className={styles.title}>{drop.title}</h2>
          <p className={styles.window}>{windowLabel(drop)}</p>
          <div className={styles.status}>
            {drop.status === 'upcoming' ? <Badge kind="coming" /> : <span>{drop.status === 'live' ? 'Live now' : 'Closed'}</span>}
          </div>
        </div>
        <ul className={styles.strip} aria-hidden="true">
          {drop.hero.lineup.slice(0, 4).map((src) => (
            <li key={src} className={styles.frame}>
              <Image src={src} alt="" fill sizes="(min-width: 768px) 15vw, 25vw" className={styles.image} />
            </li>
          ))}
        </ul>
      </Link>
    </article>
  )
}
