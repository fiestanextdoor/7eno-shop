'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCartStore } from '@/store/cart'
import { ALLOWED_COUNTRIES, COUNTRY_NAMES } from '@/lib/shipping'
import styles from './checkout.module.css'

interface Rate {
  id: string
  name: string
  rate: string
  currency: string
  minDeliveryDays?: number
  maxDeliveryDays?: number
}

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
  const [rates, setRates] = useState<Rate[] | null>(null)
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null)
  const [ratesLoading, setRatesLoading] = useState(false)
  const [ratesError, setRatesError] = useState<string | null>(null)
  const [payLoading, setPayLoading] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  const addressComplete =
    form.name.trim() !== '' &&
    form.line1.trim() !== '' &&
    form.city.trim() !== '' &&
    form.postalCode.trim() !== ''

  const subtotal = total()
  const selectedRate = rates?.find((r) => r.id === selectedRateId) ?? null
  const shippingCost = selectedRate ? parseFloat(selectedRate.rate) || 0 : 0
  const grandTotal = subtotal + shippingCost

  // Changing the address invalidates previously fetched rates, since shipping
  // depends on the destination.
  const updateField = (key: keyof AddressForm, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setRates(null)
    setSelectedRateId(null)
    setRatesError(null)
    setPayError(null)
  }

  const fetchRates = async () => {
    if (!addressComplete) {
      setRatesError('Please fill in your full shipping address first.')
      return
    }
    setRatesLoading(true)
    setRatesError(null)
    try {
      const res = await fetch('/api/shipping-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, address: form }),
      })
      const data = await res.json()
      if (!res.ok || !Array.isArray(data.rates)) {
        setRatesError(data.error ?? 'Could not calculate shipping.')
        return
      }
      const sorted: Rate[] = [...data.rates].sort(
        (a, b) => (parseFloat(a.rate) || 0) - (parseFloat(b.rate) || 0)
      )
      setRates(sorted)
      setSelectedRateId(sorted[0]?.id ?? null)
    } catch {
      setRatesError('Network error. Please try again.')
    } finally {
      setRatesLoading(false)
    }
  }

  const handleCheckout = async () => {
    if (!selectedRateId) return
    setPayLoading(true)
    setPayError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, address: form, shippingRateId: selectedRateId }),
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
        <h1 className={styles.title}>Checkout</h1>
        <span className={styles.label}>
          {items.length} item{items.length > 1 ? 's' : ''}
        </span>

        <div className={styles.items}>
          {items.map((item) => (
            <div key={item.variantId} className={styles.item}>
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

        {!rates && (
          <button
            className={styles.secondaryBtn}
            onClick={fetchRates}
            disabled={!addressComplete || ratesLoading}
          >
            {ratesLoading ? 'Calculating...' : 'Calculate shipping'}
          </button>
        )}

        {ratesError && <p className={styles.error} aria-live="polite">{ratesError}</p>}

        {rates && rates.length > 0 && (
          <>
            <h2 className={styles.sectionTitle}>Shipping method</h2>
            <div className={styles.rates}>
              {rates.map((rate) => (
                <label
                  key={rate.id}
                  className={[styles.rate, selectedRateId === rate.id ? styles.rateSelected : ''].join(' ')}
                >
                  <input
                    type="radio"
                    name="shippingRate"
                    className={styles.rateRadio}
                    checked={selectedRateId === rate.id}
                    onChange={() => setSelectedRateId(rate.id)}
                  />
                  <span className={styles.rateName}>{rate.name}</span>
                  <span className={styles.ratePrice}>&euro;{(parseFloat(rate.rate) || 0).toFixed(2)}</span>
                </label>
              ))}
            </div>
          </>
        )}

        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Subtotal</span>
            <span className={styles.summaryValue}>&euro;{subtotal.toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Shipping</span>
            <span className={styles.summaryValue}>
              {selectedRate ? `€${shippingCost.toFixed(2)}` : '—'}
            </span>
          </div>
        </div>

        <div className={styles.total}>
          <span className={styles.totalLabel}>Total</span>
          <span className={styles.totalAmount}>&euro;{grandTotal.toFixed(2)}</span>
        </div>

        {payError && <p className={styles.error} aria-live="polite">{payError}</p>}

        <button
          className={styles.payBtn}
          onClick={handleCheckout}
          disabled={payLoading || !selectedRateId}
        >
          {payLoading ? 'Redirecting...' : 'Pay with Stripe'}
        </button>
      </div>
    </main>
  )
}
