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
  computeShippingCents,
  FREE_SHIPPING_THRESHOLD,
  FLAT_SHIPPING_RATE,
} from '@/lib/shipping'
import styles from './checkout.module.css'

interface AddressForm {
  name: string
  line1: string
  line2: string
  city: string
  postalCode: string
  country: string
}

const EMPTY_FORM: AddressForm = {
  name: '',
  line1: '',
  city: '',
  line2: '',
  postalCode: '',
  country: 'NL',
}

export default function CheckoutPage() {
  const { items, total } = useCartStore()
  const [form, setForm] = useState<AddressForm>(EMPTY_FORM)
  const [agreed, setAgreed] = useState(false)
  const [payLoading, setPayLoading] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

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

  // Discount code state. The code is single-use per account and not combinable
  // with bundle deals, so it is hidden when the cart contains a bundle; the
  // server re-validates everything before applying it (app/api/checkout).
  const [promoInput, setPromoInput] = useState('')
  const [appliedCode, setAppliedCode] = useState<string | null>(null)
  const [promoPercent, setPromoPercent] = useState(0)
  const [promoFreeShipping, setPromoFreeShipping] = useState(false)
  const [promoMsg, setPromoMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [promoNeedsLogin, setPromoNeedsLogin] = useState(false)
  const [promoLoading, setPromoLoading] = useState(false)

  const addressComplete =
    form.name.trim() !== '' &&
    form.line1.trim() !== '' &&
    form.city.trim() !== '' &&
    form.postalCode.trim() !== ''

  const canPay = addressComplete && agreed

  const hasBundle = items.some((item) => Boolean(item.bundleId))

  // Shipping is a flat fee, free above the threshold. It depends only on the
  // subtotal, so it is known immediately, without an extra "calculate" step or
  // a round-trip for the destination.
  const subtotal = total()
  // A discount code can waive the fee outright; otherwise it follows the
  // subtotal threshold. The server recomputes this, the page only displays it.
  const shippingCost = promoFreeShipping ? 0 : computeShippingCents(Math.round(subtotal * 100)) / 100
  const freeShipping = shippingCost === 0
  const remainingForFree = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  // Display only: the discount applies to the product subtotal (not shipping).
  // The authoritative amount is recomputed server-side from trusted prices.
  const discount = appliedCode ? (subtotal * promoPercent) / 100 : 0
  const grandTotal = Math.max(0, subtotal + shippingCost - discount)

  const updateField = (key: keyof AddressForm, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setPayError(null)
  }

  const applyPromo = async () => {
    const code = promoInput.trim()
    if (code === '') return
    setPromoLoading(true)
    setPromoMsg(null)
    setPromoNeedsLogin(false)
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (res.ok && data.valid) {
        setAppliedCode(data.code)
        setPromoPercent(data.percentOff)
        setPromoFreeShipping(Boolean(data.freeShipping))
        setPromoMsg({
          type: 'success',
          text: `Code ${data.code} applied: ${data.percentOff}% off${data.freeShipping ? ' and free shipping' : ''}.`,
        })
      } else {
        setAppliedCode(null)
        setPromoPercent(0)
        setPromoFreeShipping(false)
        setPromoNeedsLogin(res.status === 401)
        setPromoMsg({ type: 'error', text: data.error ?? 'Could not apply this code.' })
      }
    } catch {
      setPromoMsg({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setPromoLoading(false)
    }
  }

  const removePromo = () => {
    setAppliedCode(null)
    setPromoPercent(0)
    setPromoFreeShipping(false)
    setPromoInput('')
    setPromoMsg(null)
    setPromoNeedsLogin(false)
  }

  const handleCheckout = async () => {
    if (!canPay) return
    setPayLoading(true)
    setPayError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, address: form, ...(appliedCode ? { promoCode: appliedCode } : {}) }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setPayError(data.error ?? 'Could not start checkout. Please try again.')
      }
    } catch {
      setPayError('Network error. Please try again.')
    } finally {
      setPayLoading(false)
    }
  }

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
                onChange={(e) => {
                  setPromoInput(e.target.value)
                  setPromoMsg(null)
                }}
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
            onChange={(e) => {
              setAgreed(e.target.checked)
              setPayError(null)
            }}
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
          onClick={handleCheckout}
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
