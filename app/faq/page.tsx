import type { Metadata } from 'next'
import Link from 'next/link'
import { absoluteUrl, breadcrumbJsonLd, faqJsonLd } from '@/lib/seo'
import styles from '../landing.module.css'

const DESCRIPTION =
  'Answers about ordering at 7ENO (Zeno): payment with iDEAL, delivery times for made-to-order pieces, shipping costs, 14-day returns and sizing.'

export const metadata: Metadata = {
  title: 'FAQ — ordering, delivery and returns',
  description: DESCRIPTION,
  keywords: [
    '7ENO FAQ', 'Zeno FAQ', 'verzendkosten', 'levertijd', 'retourneren', 'iDEAL betalen',
    'bestellen 7ENO', 'wanneer geleverd', 'print on demand levertijd',
  ],
  alternates: { canonical: '/faq' },
  openGraph: {
    title: 'FAQ · 7ENO (Zeno)',
    description: DESCRIPTION,
    url: absoluteUrl('/faq'),
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'FAQ · 7ENO (Zeno)', description: DESCRIPTION },
}

interface Faq {
  q: string
  /** Plain text: this exact string is both rendered and put in the FAQPage
   *  structured data, so the two can never drift apart. */
  a: string
  /** Optional follow-up link rendered under the answer (not part of the schema). */
  link?: { href: string; label: string }
}

const GROUPS: { title: string; items: Faq[] }[] = [
  {
    title: 'Ordering and payment',
    items: [
      {
        q: 'Which payment methods can I use?',
        a: 'You can pay with iDEAL or with a credit or debit card. Payments are handled by Stripe, so your card details are never stored on our own servers.',
      },
      {
        q: 'Do I need an account to order?',
        a: 'No. You can complete your order as a guest. Creating an account is optional and mainly useful if you want to follow your order status and keep your address for next time.',
      },
      {
        q: 'Can I change or cancel my order after placing it?',
        a: 'Get in touch as soon as possible at info@7eno.shop. Because every piece is made to order, production can start quickly — once it has, the order can no longer be changed, but you can still return it after delivery.',
      },
    ],
  },
  {
    title: 'Shipping and delivery',
    items: [
      {
        q: 'Which countries do you ship to?',
        a: 'We ship to the Netherlands, Belgium, Germany, France and the United Kingdom.',
      },
      {
        q: 'What does shipping cost?',
        a: 'Shipping is €4,95 per order. Orders over €75 ship free.',
      },
      {
        q: 'How long does delivery take?',
        a: 'Your order is produced after you place it, which takes 2 to 5 working days. Transit then takes another 2 to 7 days depending on the country, so most orders arrive within one to two weeks.',
      },
      {
        q: 'Can I track my order?',
        a: 'Yes. As soon as your parcel is dispatched, the tracking information appears in your account under Orders, and you receive an email with the same details.',
        link: { href: '/account/login', label: 'Sign in to see your orders' },
      },
    ],
  },
  {
    title: 'Returns and refunds',
    items: [
      {
        q: 'Can I return my order?',
        a: 'Yes. You can return your order within 14 days of delivery without giving a reason, as long as the item is unused and in its original condition.',
        link: { href: '/returns', label: 'Read the full return policy' },
      },
      {
        q: 'How do I start a return?',
        a: 'Email info@7eno.shop within 14 days of receiving your order, mentioning your order number and which items you want to return. You then receive the return address and instructions by email.',
      },
      {
        q: 'When do I get my money back?',
        a: 'Once we have received and inspected the returned item, the full purchase price is refunded within 14 days, through the same payment method you used.',
      },
      {
        q: 'Can I exchange an item for another size?',
        a: 'Because every piece is made to order, there is no exchange stock to swap from. The quickest route is to return the item you have and place a new order in the size you need.',
        link: { href: '/size-guide', label: 'Check the size guide first' },
      },
      {
        q: 'What if my item arrives damaged or wrong?',
        a: 'Contact us within 30 days at info@7eno.shop with your order number and a photo. Damaged, faulty or incorrect items are replaced or refunded at no cost to you.',
      },
    ],
  },
  {
    title: 'Products and sizing',
    items: [
      {
        q: 'Why does my order take a few days before it ships?',
        a: 'Nothing is printed in advance. Each piece is produced after you order it and shipped from within the EU, which avoids overproduction but adds a few days before dispatch.',
      },
      {
        q: 'How do I know which size to order?',
        a: 'Use the size guide: measure your chest with a soft tape measure and match it to the table. If you are between two sizes, take the larger one for a relaxed fit or the smaller one for a closer fit.',
        link: { href: '/size-guide', label: 'Open the size guide' },
      },
      {
        q: 'What is the difference between the OG and Olympian collections?',
        a: 'OG is the original, darker range built around the 7ENO mark in ink, blood red and butter. Olympian is the newer capsule with a rounded early-2000s wordmark in four dusty colourways: Coconut, Ocean, Sand and Flamingo.',
        link: { href: '/olympian', label: "See Olympian '26" },
      },
      {
        q: 'Are the Olympian colours separate products?',
        a: 'Yes. Each Olympian colourway is published as its own product rather than as a colour option, so the photos on a product page always show the exact garment that ships. You can switch between colourways with the swatches on any Olympian product page.',
      },
    ],
  },
]

const ALL = GROUPS.flatMap((g) => g.items)

export default function FaqPage() {
  const breadcrumbs = breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'FAQ', path: '/faq' },
  ])

  return (
    <main className={`${styles.page} oly-theme`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd(ALL.map((f) => ({ question: f.q, answer: f.a })))),
        }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />

      <div className={styles.inner}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Help</p>
          <h1 className={styles.title}>Questions, answered</h1>
          <p className={styles.lead}>
            Delivery times, shipping costs, returns and sizing — the things worth knowing before
            you order. Anything missing? Mail{' '}
            <a href="mailto:info@7eno.shop" className={styles.link}>info@7eno.shop</a> and a person
            will answer.
          </p>
        </header>

        {GROUPS.map((group) => (
          <section key={group.title} className={styles.section}>
            <h2 className={styles.h2}>{group.title}</h2>
            <div className={styles.faqGroup}>
              {group.items.map((item) => (
                <details key={item.q} className={styles.faqItem}>
                  <summary className={styles.faqQuestion}>{item.q}</summary>
                  <div className={styles.faqAnswer}>
                    <p>{item.a}</p>
                    {item.link && (
                      <p style={{ marginTop: 10 }}>
                        <Link href={item.link.href} className={styles.link}>{item.link.label} →</Link>
                      </p>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}

        <section className={styles.section}>
          <h2 className={styles.h2}>Ready when you are</h2>
          <div className={styles.ctaRow}>
            <Link href="/shop" className={styles.cta}>Shop the collection</Link>
            <Link href="/about" className={styles.ctaGhost}>About 7ENO</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
