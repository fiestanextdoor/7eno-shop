import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import AutoplayVideo from '@/components/ui/AutoplayVideo/AutoplayVideo'
import { buttonClasses } from '@/components/ui/Button/Button'
import DropBlock from '@/components/ui/DropBlock/DropBlock'
import ProductRow from '@/components/ui/ProductRow/ProductRow'
import WaitlistForm from '@/components/ui/WaitlistForm/WaitlistForm'
import { OLYMPN_SPORT_WORDMARK, SOMETHING_IS_COMING, SPORT_ADS } from '@/lib/brand'
import { getShopProducts, type ShopProduct } from '@/lib/catalog'
import {
  currentTimeMs, getDrop, getNextDrop, isDropListed, listDropsNewestFirst, toDropView, type DropView,
} from '@/lib/drops'
import { isPreviewSession } from '@/lib/preview-session'
import { absoluteUrl } from '@/lib/seo'
import { toTiles } from '@/lib/tiles'
import styles from './page.module.css'

const HOME_DESCRIPTION =
  '7ENO (pronounced "Zeno") is the official online streetwear store by Abra Entertainment. Shop the Olympian and OLYMPN Sport editions, with free shipping over €75 and 14-day returns.'

export const metadata: Metadata = {
  // `absolute` overrides the layout template: the homepage carries the full
  // brand phrase itself rather than the template suffix twice.
  title: { absolute: '7ENO (Zeno) · Premium Streetwear by Abra Entertainment' },
  description: HOME_DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    title: '7ENO (Zeno) · Premium Streetwear',
    description: HOME_DESCRIPTION,
    url: absoluteUrl('/'),
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '7ENO (Zeno) · Premium Streetwear',
    description: HOME_DESCRIPTION,
  },
}

// The hero follows the drop clock: re-render at least every minute, and the
// countdown refreshes the page itself at zero.
export const revalidate = 60

/** Tiles per drop row. */

/** The Olympian model photos in public/olympian (939x1400), one per colourway. */
const OLYMPIAN_MODELS = [
  { src: '/olympian/olympian-teal-model.jpg', colour: 'teal' },
  { src: '/olympian/olympian-clay-model.jpg', colour: 'clay' },
  { src: '/olympian/olympian-wheat-model.jpg', colour: 'wheat' },
  { src: '/olympian/olympian-rosa-model.jpg', colour: 'rosa' },
]

function statusLine(view: DropView): string {
  if (view.status === 'upcoming') return `${view.editionLabel} · Drops ${view.startsAtLabel}`
  if (view.status === 'live') return `${view.editionLabel} · Live now`
  return `${view.editionLabel} · Released ${view.startsOnLabel}`
}

export default async function HomePage() {
  const now = currentTimeMs()
  const preview = await isPreviewSession()
  const clock = { preview }
  const next = getNextDrop(now, clock)
  const nextView = next ? toDropView(next, now, clock) : null

  let products: ShopProduct[] = []
  try {
    products = await getShopProducts(now, clock)
  } catch (err) {
    console.error('[Home] getShopProducts failed:', err)
  }

  const rows = await Promise.all(
    listDropsNewestFirst()
      .filter((drop) => isDropListed(drop, now, clock))
      .map(async (drop) => ({
        view: toDropView(drop, now, clock),
        // Every product of the edition: the row scrolls, four in view at a time.
        tiles: await toTiles(products.filter((p) => p.drop.id === drop.id), now),
      }))
  )

  const olympian = getDrop('olympian')
  const olympianView = olympian && isDropListed(olympian, now, clock) ? toDropView(olympian, now, clock) : null
  const sport = getDrop('olympn-sport')
  const sportView = sport && isDropListed(sport, now, clock) ? toDropView(sport, now, clock) : null
  const sportTiles = sportView ? (sportView.status === 'upcoming' ? 1 : 0) + SPORT_ADS.length : 0

  return (
    <main className={styles.page}>
      {nextView && (
        <div className={styles.hero} data-tone={nextView.tone}>
          <div className={styles.heroCopy} data-reveal="hero">
            <DropBlock drop={nextView} now={now} as="h1" withIntro />
          </div>
          <div className={styles.heroMedia} data-reveal="media">
            <Image
              src={nextView.hero.image}
              alt={nextView.hero.alt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              loading="eager"
              fetchPriority="high"
              className={styles.heroImage}
            />
          </div>
        </div>
      )}

      {rows.map(({ view, tiles }, rowIndex) => (
        <ProductRow
          key={view.id}
          id={`row-${view.id}`}
          label={view.editionLabel}
          title={view.title}
          href={view.href}
          tiles={tiles}
          lineup={view.hero.lineup.map((src, i) => ({ src, alt: `${view.title} line-up, piece ${i + 1}` }))}
          eager={rowIndex === 0}
        />
      ))}

      {olympian && olympianView && (
        <section className={styles.olyBand} aria-labelledby="olympian-band-title">
          <div className={styles.olyLead}>
            <div className={styles.olyPoster} data-reveal="media">
              <Image
                src={olympian.hero.poster ?? olympian.hero.image}
                alt="Olympian campaign still"
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                className={styles.cover}
              />
            </div>
            <div className={styles.olyText} data-reveal="up">
              <p className={styles.rowLabel}>{olympianView.editionLabel}</p>
              <h2 id="olympian-band-title" className={styles.bandTitle}>Olympian in four colours</h2>
              <p className={styles.bandText}>{olympianView.intro}</p>
              <Link href={olympianView.href} className={styles.rowLink}>Shop Olympian</Link>
            </div>
          </div>
          <ul className={styles.olyModels} data-reveal="stagger">
            {OLYMPIAN_MODELS.map((model) => (
              <li key={model.src} className={styles.olyModel}>
                <Image
                  src={model.src}
                  alt={`Olympian model photo, ${model.colour} colourway`}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className={styles.cover}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {sportView && (
        <section className={styles.sportBand} data-band="sport" aria-labelledby="sport-band-title">
          <div className={styles.sportInner}>
            <div className={styles.sportHead} data-reveal="up">
              <h2 id="sport-band-title" className={styles.sportTitle}>
                <Image
                  src={OLYMPN_SPORT_WORDMARK.src}
                  alt="OLYMPN Sport"
                  width={OLYMPN_SPORT_WORDMARK.width}
                  height={OLYMPN_SPORT_WORDMARK.height}
                  sizes="(min-width: 1024px) 560px, 90vw"
                  className={styles.sportWordmark}
                />
              </h2>
              <p className={styles.sportMeta}>{statusLine(sportView)}</p>
              <Link href={sportView.href} className={buttonClasses('accent', 'lg')}>Explore OLYMPN Sport</Link>
            </div>
            <ul className={styles.sportMedia} data-reveal="stagger" style={{ '--tiles': sportTiles } as CSSProperties}>
              {sportView.status === 'upcoming' && (
                <li className={styles.sportTile} data-teaser="true">
                  <Image
                    src={SOMETHING_IS_COMING.src}
                    alt="Something is coming."
                    fill
                    sizes="(min-width: 768px) 33vw, 50vw"
                    className={styles.contain}
                  />
                </li>
              )}
              {SPORT_ADS.map((ad) => (
                <li key={ad.src} className={styles.sportTile}>
                  <AutoplayVideo src={ad.src} poster={ad.poster} label={ad.label} width={ad.width} height={ad.height} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className={styles.waitlist} aria-labelledby="waitlist-title">
        <div className={styles.waitlistInner} data-reveal="up">
          <p className={styles.waitlistLabel}>Drop alerts</p>
          <h2 id="waitlist-title" className={styles.bandTitle}>Never miss an edition</h2>
          <p className={styles.bandText}>One email when a new edition opens. No newsletter, no spam.</p>
          <WaitlistForm compact />
        </div>
      </section>
    </main>
  )
}
