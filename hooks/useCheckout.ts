import { useState } from 'react'
import type { CartItem } from '@/types/cart'
import type { AppliedPromo } from '@/hooks/useCartTotals'

export interface AddressForm {
  name: string
  line1: string
  line2: string
  city: string
  postalCode: string
  country: string
}

export const EMPTY_FORM: AddressForm = {
  name: '',
  line1: '',
  city: '',
  line2: '',
  postalCode: '',
  country: 'NL',
}

export interface PromoMessage {
  type: 'error' | 'success'
  text: string
}

export interface UseCheckoutOptions {
  /** Where a created Stripe session sends the browser. Injected in tests. */
  redirect?: (url: string) => void
}

export interface UseCheckout {
  form: AddressForm
  updateField: (key: keyof AddressForm, value: string) => void
  addressComplete: boolean
  agreed: boolean
  changeAgreed: (checked: boolean) => void
  canPay: boolean
  promoInput: string
  changePromoInput: (value: string) => void
  promo: AppliedPromo | null
  promoMsg: PromoMessage | null
  promoNeedsLogin: boolean
  promoLoading: boolean
  applyPromo: () => Promise<void>
  removePromo: () => void
  payLoading: boolean
  payError: string | null
  pay: () => Promise<void>
}

function goTo(url: string) {
  window.location.href = url
}

/**
 * Checkout form state, discount code and payment start. The server
 * (/api/promo/validate and /api/checkout) re-validates everything; this hook
 * only drives the page.
 */
export function useCheckout(items: CartItem[], { redirect = goTo }: UseCheckoutOptions = {}): UseCheckout {
  const [form, setForm] = useState<AddressForm>(EMPTY_FORM)
  const [agreed, setAgreed] = useState(false)
  const [payLoading, setPayLoading] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  // Discount code state. The code is single-use per account and not combinable
  // with bundle deals; the server re-validates everything before applying it.
  const [promoInput, setPromoInput] = useState('')
  const [promo, setPromo] = useState<AppliedPromo | null>(null)
  const [promoMsg, setPromoMsg] = useState<PromoMessage | null>(null)
  const [promoNeedsLogin, setPromoNeedsLogin] = useState(false)
  const [promoLoading, setPromoLoading] = useState(false)

  const addressComplete =
    form.name.trim() !== '' &&
    form.line1.trim() !== '' &&
    form.city.trim() !== '' &&
    form.postalCode.trim() !== ''

  const canPay = addressComplete && agreed

  const updateField = (key: keyof AddressForm, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setPayError(null)
  }

  const changeAgreed = (checked: boolean) => {
    setAgreed(checked)
    setPayError(null)
  }

  const changePromoInput = (value: string) => {
    setPromoInput(value)
    setPromoMsg(null)
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
        setPromo({ code: data.code, percentOff: data.percentOff, freeShipping: Boolean(data.freeShipping) })
        setPromoMsg({
          type: 'success',
          text: `Code ${data.code} applied: ${data.percentOff}% off${data.freeShipping ? ' and free shipping' : ''}.`,
        })
      } else {
        setPromo(null)
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
    setPromo(null)
    setPromoInput('')
    setPromoMsg(null)
    setPromoNeedsLogin(false)
  }

  const pay = async () => {
    if (!canPay) return
    setPayLoading(true)
    setPayError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, address: form, ...(promo ? { promoCode: promo.code } : {}) }),
      })
      const data = await res.json()
      if (data.url) {
        redirect(data.url)
      } else {
        setPayError(data.error ?? 'Could not start checkout. Please try again.')
      }
    } catch {
      setPayError('Network error. Please try again.')
    } finally {
      setPayLoading(false)
    }
  }

  return {
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
  }
}
