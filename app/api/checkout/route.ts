import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getProduct as getPrintfulProduct } from '@/lib/printful'
import { normalizePrintfulDetail } from '@/lib/printful-normalize'
import { buildVariantLookup as buildPrintifyLookup } from '@/lib/printify'
import { validateShippingAddress, computeShippingCents } from '@/lib/shipping'
import { getBundle } from '@/lib/bundles'
import { resolveBundleDiscountCents, type BundleMemberItem } from '@/lib/bundle-discount'
import { PROMO_CODE, PROMO_PERCENT_OFF, isValidPromoCode } from '@/lib/promo'
import { createClient } from '@/lib/supabase/server'
import type { NormalizedVariant } from '@/types/catalog'
import type { CartItem } from '@/types/cart'

export async function POST(req: NextRequest) {
  let items: CartItem[]
  let address: unknown
  let promoCode: unknown
  try {
    const body = await req.json()
    items = body.items
    address = body.address
    promoCode = body.promoCode
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }

  // Validate identifiers and quantities. Prices, currency and shipping cost are
  // NEVER trusted from the client; they are resolved server-side from Printful
  // (prices) and the flat-rate shipping rule.
  for (const item of items) {
    if (typeof item.variantId !== 'string' || typeof item.productId !== 'string'
      || item.variantId === '' || item.productId === '') {
      return NextResponse.json({ error: 'Invalid item' }, { status: 400 })
    }
    if (item.provider !== 'printful' && item.provider !== 'printify') {
      return NextResponse.json({ error: 'Invalid item provider' }, { status: 400 })
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
      return NextResponse.json({ error: 'Invalid item quantity' }, { status: 400 })
    }
  }

  const validated = validateShippingAddress(address)
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }
  const addr = validated.address

  // Resolve authoritative product/variant data from Printful, keyed by variant id.
  // Resolve authoritative variants per provider, keyed by `${provider}:${variantId}`.
  const variantLookup = new Map<string, { productName: string; variant: NormalizedVariant }>()
  try {
    const pfIds = items.filter((i) => i.provider === 'printful').map((i) => i.productId)
    const piIds = items.filter((i) => i.provider === 'printify').map((i) => i.productId)

    if (pfIds.length) {
      const details = await Promise.all([...new Set(pfIds)].map((id) => getPrintfulProduct(id)))
      for (const d of details) {
        const norm = normalizePrintfulDetail(d)
        for (const v of norm.variants) {
          variantLookup.set(`printful:${v.id}`, { productName: norm.name, variant: v })
        }
      }
    }
    if (piIds.length) {
      const piLookup = await buildPrintifyLookup([...new Set(piIds)])
      for (const [vid, entry] of piLookup) {
        variantLookup.set(`printify:${vid}`, entry)
      }
    }
  } catch (err) {
    console.error('[Checkout] Failed to resolve product prices:', err)
    return NextResponse.json({ error: 'Could not verify product prices' }, { status: 502 })
  }

  // Build line items and the cart metadata from server-trusted data only.
  type CheckoutParams = NonNullable<Parameters<typeof stripe.checkout.sessions.create>[0]>
  const lineItems: NonNullable<CheckoutParams['line_items']> = []
  const cartMeta: { r: string; p: string; v: string; q: number; b?: string }[] = []
  const bundleMembers: BundleMemberItem[] = []
  let subtotalCents = 0
  let currency = 'eur'

  for (const item of items) {
    // The variant is only present if it genuinely belongs to one of the products
    // we fetched, so its price is always authoritative regardless of what the
    // client claimed.
    const found = variantLookup.get(`${item.provider}:${item.variantId}`)
    if (!found) {
      return NextResponse.json(
        { error: 'One or more products are no longer available' },
        { status: 400 }
      )
    }

    const unitAmount = found.variant.priceCents
    if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
      return NextResponse.json({ error: 'Product price unavailable' }, { status: 502 })
    }

    // Assert a single currency across the whole cart, so the bundle coupon's
    // currency (set below) is provably the session currency. `currency` is only
    // bound from server-resolved variant data, never from the client.
    const itemCurrency = found.variant.currency.toLowerCase()
    if (cartMeta.length === 0) {
      currency = itemCurrency
    } else if (itemCurrency !== currency) {
      return NextResponse.json({ error: 'Mixed-currency cart is not supported' }, { status: 502 })
    }
    subtotalCents += unitAmount * item.quantity

    lineItems.push({
      price_data: {
        currency,
        product_data: {
          name: found.productName,
          description: found.variant.name,
          ...(item.imageUrl && item.imageUrl.startsWith('http') ? { images: [item.imageUrl] } : {}),
        },
        unit_amount: unitAmount,
      },
      quantity: item.quantity,
    })

    // Compact keys to respect Stripe's 500-char metadata limit:
    // r=provider, p=productId, v=variantId, q=quantity.
    cartMeta.push({
      r: item.provider,
      p: item.productId,
      v: item.variantId,
      q: item.quantity,
      ...(item.bundleId ? { b: item.bundleId } : {}),
    })

    // Every item past the `found` guard above has resolved to a real variant.
    if (item.bundleId) {
      bundleMembers.push({ bundleId: item.bundleId, productId: item.productId, resolved: true })
    }
  }

  // Re-derive the bundle discount server-side from server-trusted data. Only
  // complete, valid sets earn a discount; the total is clamped to the subtotal.
  const bundleDiscountCents = resolveBundleDiscountCents(bundleMembers, subtotalCents, getBundle)

  // Flat-rate shipping computed from the server-trusted subtotal: free above the
  // threshold, otherwise the fixed fee. Never read from the client.
  const shippingCents = computeShippingCents(subtotalCents)
  const shippingOption: NonNullable<CheckoutParams['shipping_options']>[number] = {
    shipping_rate_data: {
      type: 'fixed_amount',
      fixed_amount: { amount: shippingCents, currency },
      display_name: shippingCents === 0 ? 'Free shipping' : 'Standard shipping',
      delivery_estimate: {
        minimum: { unit: 'business_day', value: 5 },
        maximum: { unit: 'business_day', value: 10 },
      },
    },
  }

  const cartJson = JSON.stringify(cartMeta)
  // Stripe metadata values are limited to 500 characters.
  if (cartJson.length > 500) {
    return NextResponse.json(
      { error: 'Cart too large. Please reduce the number of items or contact support.' },
      { status: 400 }
    )
  }

  // Check if user is logged in for faster checkout
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let stripeCustomerId: string | undefined
  let customerEmail: string | undefined

  if (user) {
    customerEmail = user.email ?? undefined
    const { data: profileData } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()
    const profile = profileData as unknown as { stripe_customer_id: string | null } | null
    if (profile?.stripe_customer_id) {
      stripeCustomerId = profile.stripe_customer_id
    }
  }

  // Discount code. Single-use per account and not combinable with bundle deals,
  // so it requires a signed-in account (that is how "one use per account" is
  // enforced — see coupon_redemptions). Every check is repeated here, never
  // trusting the client or the /api/promo/validate pre-check.
  let appliedPromoCode: string | null = null
  if (typeof promoCode === 'string' && promoCode.trim() !== '') {
    if (!isValidPromoCode(promoCode)) {
      return NextResponse.json({ error: 'This discount code is not valid.' }, { status: 400 })
    }
    if (bundleMembers.length > 0) {
      return NextResponse.json(
        { error: "Discount codes can't be combined with bundle deals." },
        { status: 400 }
      )
    }
    if (!user) {
      return NextResponse.json(
        { error: 'Create an account or log in to use this discount code.' },
        { status: 401 }
      )
    }
    const { data: redeemed } = await supabase
      .from('coupon_redemptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('code', PROMO_CODE)
      .maybeSingle()
    if (redeemed) {
      return NextResponse.json(
        { error: 'You have already used this discount code.' },
        { status: 409 }
      )
    }
    appliedPromoCode = PROMO_CODE
  }

  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '')

  try {
    const sessionParams: CheckoutParams = {
      // 'card' levert in Stripe Checkout automatisch ook de wallets (Apple Pay,
      // Google Pay, Link) op ondersteunde apparaten. 'ideal' voegt iDEAL toe;
      // dit vereist EUR en mode: 'payment' (beide hierboven gegarandeerd).
      payment_method_types: ['card', 'ideal'],
      mode: 'payment',
      line_items: lineItems,
      shipping_options: [shippingOption],
      phone_number_collection: { enabled: true },
      metadata: {
        cart: cartJson,
        ship_addr: JSON.stringify(addr),
        ...(user ? { user_id: user.id } : {}),
        ...(appliedPromoCode ? { promo_code: appliedPromoCode } : {}),
      },
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout`,
    }

    // Faster checkout: reuse existing Stripe customer or pre-fill email
    if (stripeCustomerId) {
      sessionParams.customer = stripeCustomerId
    } else if (customerEmail) {
      sessionParams.customer_email = customerEmail
    }

    if (bundleDiscountCents > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: bundleDiscountCents,
        currency,
        duration: 'once',
        max_redemptions: 1,
        name: 'Combi-deal',
      })
      sessionParams.discounts = [{ coupon: coupon.id }]
    } else if (appliedPromoCode) {
      // Validated discount code (not combinable with bundles, hence else-if).
      // A fresh single-use coupon is created per session; the account-level
      // single-use is enforced separately via coupon_redemptions.
      const coupon = await stripe.coupons.create({
        percent_off: PROMO_PERCENT_OFF,
        duration: 'once',
        max_redemptions: 1,
        name: appliedPromoCode,
      })
      sessionParams.discounts = [{ coupon: coupon.id }]
    }

    const session = await stripe.checkout.sessions.create(sessionParams)
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[Stripe] checkout session creation failed:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
