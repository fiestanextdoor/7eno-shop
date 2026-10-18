import type { Metadata } from 'next'
import Link from 'next/link'
import { absoluteUrl, BASE_URL, BRAND, breadcrumbJsonLd } from '@/lib/seo'
import styles from '@/components/ui/TextPage/TextPage.module.css'

const DESCRIPTION =
  '7ENO is pronounced "Zeno". The streetwear label by Abra Entertainment from Eindhoven, made to order in numbered editions: Olympian and OLYMPN Sport.'

export const metadata: Metadata = {
  title: 'About 7ENO, pronounced "Zeno"',
  description: DESCRIPTION,
  keywords: [
    'Zeno', 'Zeno merk', 'Zeno streetwear', 'Zeno kleding', '7ENO uitspraak',
    'how to pronounce 7ENO', 'what is 7ENO', 'Abra Entertainment', '7ENO Eindhoven',
    'Zeno Eindhoven', 'Nederlands streetwear merk',
  ],
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About 7ENO (Zeno) · Streetwear by Abra Entertainment',
    description: DESCRIPTION,
    url: absoluteUrl('/about'),
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'About 7ENO (Zeno)', description: DESCRIPTION },
}

export default function AboutPage() {
  const breadcrumbs = breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
  ])

  const aboutJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About 7ENO (Zeno)',
    description: DESCRIPTION,
    url: absoluteUrl('/about'),
    isPartOf: { '@id': `${BASE_URL}/#website` },
    // Points at the Organization node in the site-wide graph so search engines
    // treat this page as the brand's own description of itself.
    mainEntity: { '@id': `${BASE_URL}/#organization` },
  }

  return (
    <main className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />

      <div className={styles.inner}>
        <header className={styles.hero} data-reveal="hero">
          <p className={styles.eyebrow}>The brand</p>
          <h1 className={styles.title}>7ENO is said &ldquo;Zeno&rdquo;</h1>
          <p className={styles.lead}>
            The 7 replaces the Z, so the name reads as a shape and sounds like a word. Most people
            hear it before they ever see it written, which is exactly why this page exists: if you
            searched for Zeno and landed here, you found the right shop.
          </p>
          <div className={styles.ctaRow}>
            <Link href="/shop" className={styles.cta}>Browse the shop</Link>
            <Link href="/archive" className={styles.ctaGhost}>See every edition</Link>
          </div>
        </header>

        <section className={styles.section} data-reveal="up">
          <h2 className={styles.h2}>Who is behind it</h2>
          <p className={styles.body}>
            7ENO is the clothing label of {BRAND.parent}, based in Eindhoven. It started from the
            same place the music and events side did: wanting something to wear that belonged to
            the project rather than being bought in and rebranded.
          </p>
          <p className={styles.body}>
            It is a small operation, run directly. Orders, questions and returns all land in the
            same inbox at{' '}
            <a href={`mailto:${BRAND.email}`} className={styles.link}>{BRAND.email}</a>, and a
            person answers them.
          </p>
        </section>

        <section className={styles.section} data-reveal="up">
          <h2 className={styles.h2}>Numbered editions</h2>
          <p className={styles.body}>
            7ENO releases in editions. Each one has a number, a release window and its own look,
            and stays in the archive once it closes.
          </p>
          <p className={styles.body}>
            <strong>Olympian</strong> is edition 01: ringer tees, knitted tees and backpacks in four
            dusty colourways. <strong>OLYMPN Sport</strong> is edition 02: oversized and relaxed
            hoodies, released as a timed drop. See{' '}
            <Link href="/collections/olympian" className={styles.link}>Olympian</Link>,{' '}
            <Link href="/collections/olympn-sport" className={styles.link}>OLYMPN Sport</Link> or the{' '}
            <Link href="/archive" className={styles.link}>archive</Link>.
          </p>
        </section>

        <section className={styles.section} data-reveal="up">
          <h2 className={styles.h2}>Nothing is made before you order it</h2>
          <p className={styles.body}>
            Every piece is produced on demand and shipped from within the EU. That is a deliberate
            choice: no warehouse full of sizes that never sell, no seasonal clear-out, and no
            guessing which colourway to over-order.
          </p>
          <p className={styles.body}>
            The honest trade-off is time. Your order is made after you place it, so production
            takes two to five working days before the parcel is handed over, instead of shipping
            the same afternoon from a shelf.
          </p>
        </section>

        <section className={styles.section} data-reveal="up">
          <h2 className={styles.h2}>Where to find us</h2>
          <div className={styles.facts}>
            <div className={styles.fact}>
              <span className={styles.factKey}>Company</span>
              <span className={styles.factVal}>7ENO by {BRAND.parent}</span>
            </div>
            <div className={styles.fact}>
              <span className={styles.factKey}>Based in</span>
              <span className={styles.factVal}>
                {BRAND.address.street}<br />
                {BRAND.address.postalCode} {BRAND.address.city}
              </span>
            </div>
            <div className={styles.fact}>
              <span className={styles.factKey}>Contact</span>
              <span className={styles.factVal}>
                <a href={`mailto:${BRAND.email}`} className={styles.link}>{BRAND.email}</a>
              </span>
            </div>
          </div>
        </section>

        <section className={styles.section} data-reveal="up">
          <h2 className={styles.h2}>Keep reading</h2>
          <div className={styles.related}>
            <Link href="/archive" className={styles.relatedCard}>
              <span className={styles.relatedTitle}>Archive</span>
              <span className={styles.relatedNote}>Every edition, its release window and its status.</span>
            </Link>
            <Link href="/size-guide" className={styles.relatedCard}>
              <span className={styles.relatedTitle}>Size guide</span>
              <span className={styles.relatedNote}>How the tees fit and how to measure yourself.</span>
            </Link>
            <Link href="/faq" className={styles.relatedCard}>
              <span className={styles.relatedTitle}>FAQ</span>
              <span className={styles.relatedNote}>Delivery times, returns and payment methods.</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
