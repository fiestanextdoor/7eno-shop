import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav/Nav'
import styles from './returns.module.css'

export const metadata: Metadata = {
  title: 'Returns — 7ENO',
  description: 'How returns work at 7ENO: a simple 14-day return process for your order.',
}

const STEPS = [
  {
    title: 'Email us within 14 days',
    body: (
      <>
        Send a message to{' '}
        <a href="mailto:info@7eno.shop" className={styles.link}>info@7eno.shop</a>{' '}
        within 14 days of receiving your order. Include your order number and let us know which item(s) you want to return.
      </>
    ),
  },
  {
    title: 'Receive your return instructions',
    body: <>We reply with the return address and clear instructions. No need to print complicated forms, just follow the steps in our email.</>,
  },
  {
    title: 'Ship it back & get refunded',
    body: <>Send the item back unused and in its original condition. Once we receive and inspect it, we refund the full purchase price within 14 days via your original payment method.</>,
  },
]

export default function ReturnsPage() {
  return (
    <>
      <Nav />
      <main className={styles.page}>
        <div className={styles.inner}>
          <h1 className={styles.title}>Returns</h1>
          <p className={styles.meta}>Last updated: June 2026</p>

          <p className={styles.intro}>
            Changed your mind? No problem. As a consumer you have the right to return your order within
            14 days of delivery, without giving a reason. Here is how it works.
          </p>

          <section className={styles.section}>
            <h2 className={styles.heading}>How to return in 3 steps</h2>
            <ol className={styles.steps}>
              {STEPS.map((step, i) => (
                <li key={step.title} className={styles.step}>
                  <span className={styles.stepNum} aria-hidden="true">{i + 1}</span>
                  <div className={styles.stepText}>
                    <span className={styles.stepTitle}>{step.title}</span>
                    <p>{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>What can I return?</h2>
            <p>
              Standard print-on-demand items without personalisation can be returned within the 14-day
              period, as long as they are unused, unwashed, and in their original condition.
            </p>
            <p>
              Custom-made or personalised products cannot be returned, as they are produced specifically
              for you.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>Defective or incorrect items</h2>
            <p>
              Received something damaged, faulty, or different from what you ordered? Contact us within 30
              days at{' '}
              <a href="mailto:info@7eno.shop" className={styles.link}>info@7eno.shop</a>{' '}
              with a photo of the issue. We will arrange a replacement or full refund at no extra cost to you.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>Return shipping costs</h2>
            <p>
              Return shipping is at your own expense, unless the product is defective or we sent the wrong
              item, in which case we cover the cost.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>Refunds</h2>
            <p>
              Refunds are issued to your original payment method within 14 days after we receive and
              inspect your return. This includes the original outbound shipping costs.
            </p>
          </section>

          <p className={styles.legal}>
            For the full legal details, see our{' '}
            <Link href="/terms" className={styles.link}>Terms &amp; Conditions</Link>.
          </p>
        </div>
      </main>
    </>
  )
}
