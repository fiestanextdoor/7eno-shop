import styles from './DonationBanner.module.css'

interface DonationBannerProps {
  /**
   * `bar` is the full-width strip used on the shop overview; `inline` is the
   * compact card used inside the single-product info panel.
   */
  variant?: 'bar' | 'inline'
}

/**
 * States that 100% of 7ENO's profit is donated to Life4HSP. Shown on the shop
 * overview and on every single-product page.
 */
export default function DonationBanner({ variant = 'bar' }: DonationBannerProps) {
  return (
    <aside className={variant === 'inline' ? styles.inline : styles.bar} aria-label="Charity">
      <span className={styles.mark} aria-hidden="true">♡</span>
      <p className={styles.text}>
        <span className={styles.kicker}>Wear it for good</span>
        <span className={styles.statement}>
          100% of our profit is donated to <strong className={styles.cause}>Life4HSP</strong>.
        </span>
      </p>
    </aside>
  )
}
