import styles from './DonationBanner.module.css'

interface DonationBannerProps {
  /**
   * `bar` is the full-width strip used on the shop overview; `inline` is the
   * compact card used inside the single-product info panel.
   */
  variant?: 'bar' | 'inline'
  /**
   * `profit` (default): 100% of 7ENO's profit is donated — used as the general
   * statement. `product`: 100% of *this product's* proceeds are donated — used
   * on the Life4HSP collaboration product, which gives away the whole sale.
   */
  scope?: 'profit' | 'product'
}

/**
 * States how much 7ENO donates to Life4HSP. Shown on the shop overview and on
 * every single-product page; the Life4HSP collaboration product uses
 * scope="product" to signal that 100% of that product is donated.
 */
export default function DonationBanner({ variant = 'bar', scope = 'profit' }: DonationBannerProps) {
  return (
    <aside className={variant === 'inline' ? styles.inline : styles.bar} aria-label="Charity">
      <span className={styles.mark} aria-hidden="true">♡</span>
      <p className={styles.text}>
        <span className={styles.kicker}>Wear it for good</span>
        <span className={styles.statement}>
          {scope === 'product' ? '100% of this product' : '100% of our profit'} is donated to{' '}
          <a
            href="https://life4hsp.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.cause}
          >
            Life4HSP
          </a>
          .
        </span>
      </p>
    </aside>
  )
}
