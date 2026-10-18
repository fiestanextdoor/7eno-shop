import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import DropBlock from '@/components/ui/DropBlock/DropBlock'
import ShopView from '@/components/ui/ShopView/ShopView'
import { getShopProducts, type ShopProduct } from '@/lib/catalog'
import { DROPS, currentTimeMs, formatEdition, getDropBySlug, isDropListed, toDropView } from '@/lib/drops'
import { isPreviewSession } from '@/lib/preview-session'
import { toTiles } from '@/lib/tiles'
import { absoluteUrl, breadcrumbJsonLd, collectionDescription } from '@/lib/seo'
import styles from './collection.module.css'

interface Props {
  params: Promise<{ slug: string }>
}

// The drop clock decides what this page shows. Re-render at least every
// minute so a release flips without a deploy; the countdown also refreshes
// the page itself when it reaches zero.
export const revalidate = 60

// Build time has no preview session: an upcoming drop without a teaser is
// not pre-rendered (and stays a 404 until it is listed).
export function generateStaticParams() {
  const now = currentTimeMs()
  return DROPS.filter((d) => isDropListed(d, now)).map((d) => ({ slug: d.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const drop = getDropBySlug(slug)
  if (!drop) return { title: 'Collection not found' }
  const title = `${drop.title} · ${formatEdition(drop.edition)}`
  const url = `/collections/${drop.slug}`
  const description = collectionDescription(drop)
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title: `${title} · 7ENO (Zeno)`, description, url: absoluteUrl(url), type: 'website' },
    twitter: { card: 'summary', title: `${title} · 7ENO (Zeno)`, description },
  }
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params
  const drop = getDropBySlug(slug)
  if (!drop) notFound()

  const now = currentTimeMs()
  const preview = await isPreviewSession()
  // A drop without a teaser stays fully hidden until its release (spec section 4).
  if (!isDropListed(drop, now, { preview })) notFound()

  const view = toDropView(drop, now, { preview })
  let products: ShopProduct[] = []
  try {
    products = (await getShopProducts(now, { preview })).filter((p) => p.drop.id === drop.id)
  } catch (err) {
    console.error('[Collection] getShopProducts failed:', err)
  }
  const tiles = await toTiles(products, now)

  const breadcrumbs = breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: drop.title, path: `/collections/${drop.slug}` },
  ])

  return (
    <main className={styles.page} data-tone={drop.tone}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <DropBlock drop={view} now={now} as="h1" withIntro withLink={false} />
      {tiles.length > 0 ? (
        <ShopView filters={[]} sort="featured" sortOptions={[]} tiles={tiles} />
      ) : (
        <section className={styles.lineup} aria-label={`${drop.title} line-up`}>
          <ul className={styles.lineupGrid} data-reveal="stagger">
            {drop.hero.lineup.map((src, i) => (
              <li key={src} className={styles.lineupItem}>
                <Image
                  src={src}
                  alt={`${drop.title} line-up, piece ${i + 1} of ${drop.hero.lineup.length}`}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  loading={i < 4 ? 'eager' : 'lazy'}
                  className={styles.lineupImage}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
