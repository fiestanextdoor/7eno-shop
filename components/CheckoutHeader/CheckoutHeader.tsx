import { LogoWordmark } from '@/components/Logo/Logo'
import styles from './CheckoutHeader.module.css'

/**
 * Minimal header for the sealed checkout: just the centred 7ENO wordmark.
 * Deliberately NOT a link, so the customer can't navigate back into the store
 * until the order is placed.
 */
export default function CheckoutHeader() {
  return (
    <header className={styles.header}>
      <LogoWordmark variant="ink" height={30} align="center" priority />
    </header>
  )
}
