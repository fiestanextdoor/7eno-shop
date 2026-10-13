'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/cart'
import { cartItemKey } from '@/lib/cart-key'
import {
  ALLOWED_COUNTRIES,
  COUNTRY_NAMES,
  FREE_SHIPPING_THRESHOLD,
  FLAT_SHIPPING_RATE,
} from '@/lib/shipping'
import { useCheckout } from '@/hooks/useCheckout'
import { useCartTotals } from '@/hooks/useCartTotals'
import styles from './checkout.module.css'

export default function CheckoutPage() {
  const { items } = useCartStore()
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

  // Detect auth so we only nudge guests to create an account. null = not yet
  // resolved, so we never flash the notice for logged-in customers. Mirrors the
  // AccountButton pattern (getUser + onAuthStateChange).
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session?.user)
    })
    return () => subscription.unsubscribe()
  }, [])

  const appliedCode = promo?.code ?? null
  const promoPercent = promo?.percentOff ?? 0
  const promoFreeShipping = promo?.freeShipping ?? false

  const hasBundle = items.some((item) => Boolean(item.bundleId))

  // Shipping is a flat fee, free above the threshold, or waived by a discount
  // code. The server recomputes all of this; the page only displays it.
  const {
    subtotal,
    shippingCost,
    freeShipping,
    remainingForFree,
    promoDiscount: discount,
    grandTotal,
  } = useCartTotals(promo)

  if (items.length === 0) {
    return (
      <main className={styles.page}>
        <div className={styles.inner}>
          <p className={styles.empty}>Your cart is empty.</p>
          <Link href="/shop" className={styles.backLink}>Back to Shop</Link>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Checkout</h1>
        </div>
        <span className={styles.label}>
          {items.length} item{items.length > 1 ? 's' : ''}
        </span>

        <div className={styles.presaleNotice} role="status">
          <svg
            className={styles.presaleIcon}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className={styles.presaleText}>
            <strong className={styles.presaleTitle}>Pre-sale order</strong>
            Because pre-sale is active, shipping can run up to{' '}
            <strong>5 working days</strong> longer than the usual estimate. Your
            order is reserved and ships the moment stock lands.
          </p>
        </div>

        <div className={styles.items}>
          {items.map((item) => (
            <div key={cartItemKey(item.provider, item.variantId, item.bundleId, item.productId)} className={styles.item}>
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.productName}
                  width={72}
                  height={72}
                  className={styles.itemImg}
                />
              ) : (
                <div className={styles.itemImgPlaceholder} />
              )}
              <div>
                <div className={styles.itemName}>{item.productName}</div>
                <div className={styles.itemVariant}>
                  {item.variantName} &middot; qty {item.quantity}
                </div>
              </div>
              <span className={styles.itemPrice}>
                &euro;{((parseFloat(item.price) || 0) * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <h2 className={styles.sectionTitle}>Shipping address</h2>
        <div className={styles.form}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Full name</span>
            <input
              className={styles.input}
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Address</span>
            <input
              className={styles.input}
              type="text"
              autoComplete="address-line1"
              value={form.line1}
              onChange={(e) => updateField('line1', e.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Address line 2 (optional)</span>
            <input
              className={styles.input}
              type="text"
              autoComplete="address-line2"
              value={form.line2}
              onChange={(e) => updateField('line2', e.target.value)}
            />
          </label>
          <div className={styles.fieldRow}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Postal code</span>
              <input
                className={styles.input}
                type="text"
                autoComplete="postal-code"
                value={form.postalCode}
                onChange={(e) => updateField('postalCode', e.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>City</span>
              <input
                className={styles.input}
                type="text"
                autoComplete="address-level2"
                value={form.city}
                onChange={(e) => updateField('city', e.target.value)}
              />
            </label>
          </div>
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

        <h2 className={styles.sectionTitle}>Discount code</h2>
        <div className={styles.promo}>
          {hasBundle ? (
            <p className={styles.shippingNote}>
              Discount codes can&apos;t be combined with bundle deals.
            </p>
          ) : appliedCode ? (
            <div className={styles.promoApplied}>
              <span className={styles.promoAppliedText}>
                Code <strong>{appliedCode}</strong> · {promoPercent}% off
                {promoFreeShipping ? ' · free shipping' : ''}
              </span>
              <button type="button" className={styles.promoRemove} onClick={removePromo}>
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
              <button
                type="button"
                className={styles.promoBtn}
                onClick={applyPromo}
                disabled={promoLoading || promoInput.trim() === ''}
              >
                {promoLoading ? '…' : 'Apply'}
              </button>
            </div>
          )}
          {promoMsg && (
            <p
              className={promoMsg.type === 'error' ? styles.promoError : styles.promoSuccess}
              aria-live="polite"
            >
              {promoMsg.text}
              {promoNeedsLogin && (
                <>
                  {' '}
                  <Link href="/account/login?redirect=/checkout" className={styles.agreeLink}>
                    Log in
                  </Link>
                </>
              )}
            </p>
          )}
        </div>

        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Subtotal</span>
            <span className={styles.summaryValue}>&euro;{subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Discount ({appliedCode})</span>
              <span className={styles.summaryValue}>-&euro;{discount.toFixed(2)}</span>
            </div>
          )}
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Shipping</span>
            <span className={styles.summaryValue}>
              {freeShipping ? 'Free' : `€${shippingCost.toFixed(2)}`}
            </span>
          </div>
          <p className={styles.shippingNote}>
            {promoFreeShipping
              ? `✓ Free shipping included with code ${appliedCode}.`
              : freeShipping
                ? `✓ You qualify for free shipping (orders over €${FREE_SHIPPING_THRESHOLD.toFixed(0)}).`
                : `Flat €${FLAT_SHIPPING_RATE.toFixed(2)} shipping. Add €${remainingForFree.toFixed(2)} more for free shipping.`}
          </p>
        </div>

        <div className={styles.total}>
          <span className={styles.totalLabel}>Total</span>
          <span className={styles.totalAmount}>&euro;{grandTotal.toFixed(2)}</span>
        </div>

        {loggedIn === false && (
          <div className={styles.guestNotice}>
            <svg
              className={styles.guestNoticeIcon}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            <p className={styles.guestNoticeText}>
              Checking out as a guest.{' '}
              <Link href="/account/login?redirect=/checkout" className={styles.agreeLink}>
                Log in
              </Link>{' '}
              or{' '}
              <Link href="/account/register" className={styles.agreeLink}>
                create an account
              </Link>{' '}
              to track your order and check out faster next time. You can still pay as a guest below.
            </p>
          </div>
        )}

        {payError && <p className={styles.error} aria-live="polite">{payError}</p>}

        <label className={styles.agree}>
          <input
            type="checkbox"
            className={styles.agreeCheckbox}
            checked={agreed}
            onChange={(e) => changeAgreed(e.target.checked)}
          />
          <span className={styles.agreeText}>
            I agree to the{' '}
            <Link href="/terms" target="_blank" rel="noopener noreferrer" className={styles.agreeLink}>
              Terms &amp; Conditions
            </Link>{' '}
            and{' '}
            <Link href="/returns" target="_blank" rel="noopener noreferrer" className={styles.agreeLink}>
              Returns Policy
            </Link>
            .
          </span>
        </label>

        <button
          className={styles.payBtn}
          onClick={pay}
          disabled={payLoading || !canPay}
        >
          {payLoading ? 'Redirecting...' : 'Pay with Stripe'}
        </button>
        {!addressComplete && (
          <p className={styles.shippingNote}>Fill in your shipping address to continue.</p>
        )}
        {addressComplete && !agreed && (
          <p className={styles.shippingNote}>
            Please accept the Terms &amp; Conditions and Returns Policy to continue.
          </p>
        )}
      </div>
    </main>
  )
}
