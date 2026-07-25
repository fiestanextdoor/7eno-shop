import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getCatalogProducts } from '@/lib/catalog'
import { resolveCardImage } from '@/lib/card-image'
import { classify } from '@/lib/product-classify'
import { OLYMPIAN_COLORWAYS } from '@/lib/color-utils'
import { productSlug } from '@/lib/slug'
import { absoluteUrl, BASE_URL, breadcrumbJsonLd } from '@/lib/seo'
import styles from '../landing.module.css'

const DESCRIPTION =
  "Olympian '26 is the 7ENO (Zeno) capsule in four colourways: Coconut, Ocean, Sand and Flamingo. Ringer tees, knitted tees and backpacks with a Y2K wordmark, made to order."

export const metadata: Metadata = {
  title: "Olympian '26 collection",
  description: DESCRIPTION,
  keywords: [
    'Olympian collection', "Olympian '26", 'Olympian tee', 'Olympian 7ENO', 'Olympian Zeno',
    'Y2K streetwear', 'retro streetwear', 'ringer tee', '7ENO Olympian', 'Zeno Olympian',
  ],
  alternates: { canonical: '/olympian' },
  openGraph: {
    title: "Olympian '26 · 7ENO (Zeno)",
    description: DESCRIPTION,
    url: absoluteUrl('/olympian'),
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: "Olympian '26 · 7ENO (Zeno)", description: DESCRIPTION },
}

// The catalogue drives the page, so a product published in Printful appears
// here without a code change. Same window as the shop's product list.
export const revalidate = 300

// Light colourways need dark type; the two saturated ones flip to bone.
const DARK_COLOURWAYS = new Set(['coconut', 'ocean'])

const COLOURWAY_NOTES: Record<string, string> = {
  coconut: 'Warm clay on off-white',
  ocean: 'Deep teal, the loudest of the four',
  sand: 'Soft wheat, the quiet one',
  flamingo: 'Rosa, the pop',
}

export default async function OlympianPage() {
  let products: Awaited<ReturnType<typeof getCatalogProducts>> = []
  try {
    products = await getCatalogProducts()
  } catch {
    // Catalogue unavailable: the editorial content below still stands on its own.
  }

  const olympian = products.filter((p) => classify(p.name).isOlympian)

  const cards = await Promise.all(
    olympian.map(async (p) => {
      const slug = productSlug(p.name)
      return {
        slug,
        name: p.name,
        priceCents: p.priceCents,
        currency: p.currency,
        image: await resolveCardImage({ slug, thumbnailUrl: p.thumbnailUrl }),
      }
    }),
  )

  // Each colourway links to a real product carrying that colourway, so the
  // cards never point at a dead end.
  const colourwayLink = (key: string) => {
    const match = olympian.find((p) => p.name.toLowerCase().includes(key))
    return match ? `/shop/${productSlug(match.name)}` : '/shop?line=olympian'
  }

  const fmt = (cents?: number, currency?: string) =>
    cents ? `${currency === 'USD' ? '$' : '€'}${(cents / 100).toFixed(2)}` : ''

  const breadcrumbs = breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: "Olympian '26", path: '/olympian' },
  ])

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: "Olympian '26 — 7ENO (Zeno)",
    description: DESCRIPTION,
    url: absoluteUrl('/olympian'),
    isPartOf: { '@id': `${BASE_URL}/#website` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: cards.length,
      itemListElement: cards.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.name,
        url: absoluteUrl(`/shop/${c.slug}`),
      })),
    },
  }

  return (
    <main className={`${styles.page} oly-theme`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />

      <div className={`${styles.inner} ${styles.innerWide}`}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>The capsule</p>
          <h1 className={styles.title}>Olympian &rsquo;26</h1>
          <div className={styles.band} aria-hidden="true">
            {OLYMPIAN_COLORWAYS.map((c) => (
              <span key={c.key} style={{ background: c.hex }} />
            ))}
          </div>
          <p className={styles.lead}>
            Four colourways, one wordmark. Olympian is the side of 7ENO that looks back at the
            early 2000s: soft rounded letters, warm washed tones and pieces built to be worn
            plainly rather than styled hard.
          </p>
          <div className={styles.ctaRow}>
            <Link href="/shop?line=olympian" className={styles.cta}>Shop the collection</Link>
            <Link href="/size-guide" className={styles.ctaGhost}>Find your size</Link>
          </div>
        </header>

        <section className={styles.section}>
          <h2 className={styles.h2}>The four colourways</h2>
          <p className={styles.body}>
            Every Olympian piece is published in its own colourway rather than as a colour option,
            so what you see on a product page is exactly the garment that ships. Pick a colour and
            the whole family follows: tee, knitted tee and backpack.
          </p>
          <div className={styles.colourways}>
            {OLYMPIAN_COLORWAYS.map((c) => (
              <Link
                key={c.key}
                href={colourwayLink(c.key)}
                className={`${styles.colourway} ${DARK_COLOURWAYS.has(c.key) ? styles.onDark : ''}`}
                style={{ background: c.hex }}
              >
                <span className={styles.colourwayName}>{c.name}</span>
                <span className={styles.colourwayNote}>{COLOURWAY_NOTES[c.key]}</span>
              </Link>
            ))}
          </div>
        </section>

        {cards.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.h2}>In the collection</h2>
            <p className={styles.body}>
              {cards.length} pieces, all made to order and shipped from within the EU.
            </p>
            <div className={styles.products}>
              {cards.map((c) => (
                <Link key={c.slug} href={`/shop/${c.slug}`} className={styles.product}>
                  <span className={styles.productImage}>
                    {c.image && (
                      <Image src={c.image} alt={c.name} fill sizes="(max-width: 900px) 50vw, 280px" />
                    )}
                  </span>
                  <span className={styles.productName}>{c.name}</span>
                  <span className={styles.productPrice}>{fmt(c.priceCents, c.currency)}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className={styles.section}>
          <h2 className={styles.h2}>A Y2K wordmark, drawn not borrowed</h2>
          <p className={styles.body}>
            The Olympian logo leans on the rounded, almost inflated letterforms that were
            everywhere around 2000 — the kind of type you saw on sports packaging and early
            software boxes. It is set large and low-contrast so the garment reads as a colour
            first and a graphic second.
          </p>
          <p className={styles.body}>
            That is also why the palette avoids primary colours. Coconut, Ocean, Sand and Flamingo
            are all slightly dusty, which keeps the pieces wearable next to the darker{' '}
            <Link href="/shop?line=og" className={styles.link}>OG collection</Link> rather than
            competing with it.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>Made to order, not to a warehouse</h2>
          <p className={styles.body}>
            Nothing in this collection is printed before you order it. Each piece is produced on
            demand and shipped from within the EU, which means no stock sitting in boxes and no
            end-of-season pile to discount away. The trade-off is honest: production takes a few
            days before the parcel moves.
          </p>
          <div className={styles.facts}>
            <div className={styles.fact}>
              <span className={styles.factKey}>Production</span>
              <span className={styles.factVal}>2–5 working days before dispatch</span>
            </div>
            <div className={styles.fact}>
              <span className={styles.factKey}>Shipping</span>
              <span className={styles.factVal}>€4,95 — free over €75</span>
            </div>
            <div className={styles.fact}>
              <span className={styles.factKey}>Returns</span>
              <span className={styles.factVal}>14 days, no reason needed</span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>Keep reading</h2>
          <div className={styles.related}>
            <Link href="/about" className={styles.relatedCard}>
              <span className={styles.relatedTitle}>About 7ENO</span>
              <span className={styles.relatedNote}>Where the name comes from, and why it is said &ldquo;Zeno&rdquo;.</span>
            </Link>
            <Link href="/size-guide" className={styles.relatedCard}>
              <span className={styles.relatedTitle}>Size guide</span>
              <span className={styles.relatedNote}>Measure once, order the right size the first time.</span>
            </Link>
            <Link href="/faq" className={styles.relatedCard}>
              <span className={styles.relatedTitle}>FAQ</span>
              <span className={styles.relatedNote}>Delivery, returns, payment and made-to-order answered.</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
