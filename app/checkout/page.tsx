'use client'

import { useEffect, useId, useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button/Button'
import { useCartTotals } from '@/hooks/useCartTotals'
import { useCheckout, type AddressForm } from '@/hooks/useCheckout'
import { formatEuro } from '@/lib/money'
import { ALLOWED_COUNTRIES, COUNTRY_NAMES, FLAT_SHIPPING_RATE, FREE_SHIPPING_THRESHOLD } from '@/lib/shipping'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/cart'
import OrderSummary from './OrderSummary'
import styles from './checkout.module.css'

const ADDRESS_FIELDS: { key: keyof AddressForm; label: string; autoComplete: string; half?: boolean }[] = [
  { key: 'name', label: 'Full name', autoComplete: 'name' },
  { key: 'line1', label: 'Address', autoComplete: 'address-line1' },
  { key: 'line2', label: 'Address line 2 (optional)', autoComplete: 'address-line2' },
  { key: 'postalCode', label: 'Postal code', autoComplete: 'postal-code', half: true },
  { key: 'city', label: 'City', autoComplete: 'address-level2', half: true },
]

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items)
  const {
    form,
    updateField,
    addressComplete,
    agreed,
    changeAgreed,
    canPay,
    promoInput,
    changePromoInput,
    promo,
    promoMsg,
    promoNeedsLogin,
    promoLoading,
    applyPromo,
    removePromo,
    payLoading,
    payError,
    pay,
  } = useCheckout(items)
  const summaryId = useId()
  const [summaryOpen, setSummaryOpen] = useState(false)

  // Detect auth so only guests are nudged to create an account. null = not
  // resolved yet, so a logged-in customer never sees the notice flash.
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session?.user)
    })
    return () => subscription.unsubscribe()
  }, [])

  const appliedCode = promo?.code ?? null
  const promoFreeShipping = promo?.freeShipping ?? false
  const hasBundle = items.some((item) => Boolean(item.bundleId))

  // Flat fee, free above the threshold, or waived by a code. The server
  // recomputes all of this; the page only displays it.
  const { subtotal, shippingCost, freeShipping, remainingForFree, promoDiscount: discount, grandTotal } =
    useCartTotals(promo)

  const shippingNote = promoFreeShipping
    ? `✓ Free shipping included with code ${appliedCode}.`
    : freeShipping
      ? `✓ You qualify for free shipping (orders over €${FREE_SHIPPING_THRESHOLD.toFixed(0)}).`
      : `Flat €${FLAT_SHIPPING_RATE.toFixed(2)} shipping. Add €${remainingForFree.toFixed(2)} more for free shipping.`

  if (items.length === 0) {
    return (
      <main className={styles.page}>
        <div className={styles.emptyState}>
          <p className={styles.empty}>Your cart is empty.</p>
          <Link href="/shop" className={styles.textLink}>Back to Shop</Link>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.summary} aria-label="Order summary">
          <button
            type="button"
            className={styles.summaryToggle}
            aria-expanded={summaryOpen}
            aria-controls={summaryId}
            onClick={() => setSummaryOpen((open) => !open)}
          >
            <span>{summaryOpen ? 'Hide order summary' : 'Show order summary'}</span>
            <span className={styles.summaryToggleTotal}>{formatEuro(grandTotal)}</span>
          </button>
          <div id={summaryId} className={styles.summaryBody} data-open={summaryOpen ? 'true' : 'false'}>
            <h2 className={styles.summaryTitle}>Order summary</h2>
            <OrderSummary
              items={items}
              subtotal={subtotal}
              discount={discount}
              appliedCode={appliedCode}
              shippingCost={shippingCost}
              freeShipping={freeShipping}
              shippingNote={shippingNote}
              grandTotal={grandTotal}
            />
          </div>
        </aside>

        <div className={styles.form}>
          <div>
            <h1 className={styles.title}>Checkout</h1>
            <p className={styles.count}>
              {items.length} item{items.length > 1 ? 's' : ''}
            </p>
          </div>

          <div className={styles.notice} role="status">
            <svg className={styles.noticeIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
              <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className={styles.noticeText}>
              <strong className={styles.noticeTitle}>Pre-sale order</strong>
              Because pre-sale is active, shipping can run up to <strong>5 working days</strong> longer than the usual
              estimate. Your order is reserved and ships the moment stock lands.
            </p>
          </div>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Shipping address</h2>
            <div className={styles.fields}>
              {ADDRESS_FIELDS.map((field) => (
                <label key={field.key} className={field.half ? `${styles.field} ${styles.half}` : styles.field}>
                  <span className={styles.fieldLabel}>{field.label}</span>
                  <input
                    className={styles.input}
                    type="text"
                    autoComplete={field.autoComplete}
                    value={form[field.key]}
                    onChange={(e) => updateField(field.key, e.target.value)}
                  />
                </label>
              ))}
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Country</span>
                <select
                  className={styles.input}
                  autoComplete="country"
                  value={form.country}
                  onChange={(e) => updateField('country', e.target.value)}
                >
                  {ALLOWED_COUNTRIES.map((code) => (
                    <option key={code} value={code}>
                      {COUNTRY_NAMES[code]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Discount code</h2>
            {hasBundle ? (
              <p className={styles.hint}>Discount codes can&apos;t be combined with bundle deals.</p>
            ) : appliedCode ? (
              <div className={styles.promoApplied}>
                <span>
                  Code <strong>{appliedCode}</strong> · {promo?.percentOff ?? 0}% off
                  {promoFreeShipping ? ' · free shipping' : ''}
                </span>
                <button type="button" className={styles.textButton} onClick={removePromo}>
                  Remove
                </button>
              </div>
            ) : (
              <div className={styles.promoRow}>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Discount code"
                  value={promoInput}
                  onChange={(e) => changePromoInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      applyPromo()
                    }
                  }}
                  aria-label="Discount code"
                />
                <Button
                  variant="ghost"
                  onClick={applyPromo}
                  disabled={promoLoading || promoInput.trim() === ''}
                >
                  {promoLoading ? '…' : 'Apply'}
                </Button>
              </div>
            )}
            {promoMsg && (
              <p className={styles.message} data-type={promoMsg.type} aria-live="polite">
                {promoMsg.text}
                {promoNeedsLogin && (
                  <>
                    {' '}
                    <Link href="/account/login?redirect=/checkout" className={styles.textLink}>
                      Log in
                    </Link>
                  </>
                )}
              </p>
            )}
          </section>

          {loggedIn === false && (
            <p className={styles.guest}>
              Checking out as a guest.{' '}
              <Link href="/account/login?redirect=/checkout" className={styles.textLink}>
                Log in
              </Link>{' '}
              or{' '}
              <Link href="/account/register" className={styles.textLink}>
                create an account
              </Link>{' '}
              to track your order and check out faster next time. You can still pay as a guest below.
            </p>
          )}

          {payError && (
            <p className={styles.error} aria-live="polite">
              {payError}
            </p>
          )}

          <label className={styles.agree}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={agreed}
              onChange={(e) => changeAgreed(e.target.checked)}
            />
            <span>
              I agree to the{' '}
              <Link href="/terms" target="_blank" rel="noopener noreferrer" className={styles.textLink}>
                Terms &amp; Conditions
              </Link>{' '}
              and{' '}
              <Link href="/returns" target="_blank" rel="noopener noreferrer" className={styles.textLink}>
                Returns Policy
              </Link>
              .
            </span>
          </label>

          <Button variant="primary" size="lg" className={styles.pay} onClick={pay} disabled={!canPay} loading={payLoading}>
            {payLoading ? 'Redirecting...' : 'Pay with Stripe'}
          </Button>
          {!addressComplete && <p className={styles.hint}>Fill in your shipping address to continue.</p>}
          {addressComplete && !agreed && (
            <p className={styles.hint}>Please accept the Terms &amp; Conditions and Returns Policy to continue.</p>
          )}
        </div>
      </div>
    </main>
  )
}
