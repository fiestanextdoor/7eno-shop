import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { buildVariantLookup, getShippingRates, type ShippingRateItem } from '@/lib/printful'
import { validateShippingAddress } from '@/lib/shipping'
import { createClient } from '@/lib/supabase/server'
import type { CartItem } from '@/types/cart'

// Strip characters Stripe rejects in a shipping rate display_name and cap length.
function sanitizeDisplayName(name: string): string {
  const clean = name.replace(/[‐-―]/g, '-').replace(/[^\x20-\x7E]/g, '').trim()
  const trimmed = clean.length > 50 ? clean.slice(0, 50).trim() : clean
  return trimmed || 'Shipping'
}

export async function POST(req: NextRequest) {
  let items: CartItem[]
  let address: unknown
  let shippingRateId: unknown
  try {
    const body = await req.json()
    items = body.items
    address = body.address
    shippingRateId = body.shippingRateId
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }

  if (typeof shippingRateId !== 'string' || !shippingRateId) {
    return NextResponse.json({ error: 'No shipping option selected' }, { status: 400 })
  }

  // Validate identifiers and quantities. Prices, currency and shipping cost are
  // NEVER trusted from the client; they are resolved server-side from Printful.
  for (const item of items) {
    if (!Number.isInteger(item.variantId) || !Number.isInteger(item.productId)) {
      return NextResponse.json({ error: 'Invalid item' }, { status: 400 })
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
  let variantLookup: Awaited<ReturnType<typeof buildVariantLookup>>
  try {
    variantLookup = await buildVariantLookup(items.map((i) => i.productId))
  } catch (err) {
    console.error('[Checkout] Failed to resolve product prices from Printful:', err)
    return NextResponse.json({ error: 'Could not verify product prices' }, { status: 502 })
  }

  // Build line items and the cart metadata from server-trusted data only.
  type CheckoutParams = NonNullable<Parameters<typeof stripe.checkout.sessions.create>[0]>
  const lineItems: NonNullable<CheckoutParams['line_items']> = []
  const cartMeta: { variantId: number; quantity: number; productName: string; variantName: string }[] = []
  const rateItems: ShippingRateItem[] = []

  for (const item of items) {
    // The variant is only present if it genuinely belongs to one of the products
    // we fetched, so its price is always authoritative regardless of what the
    // client claimed.
    const found = variantLookup.get(item.variantId)
    if (!found) {
      return NextResponse.json(
        { error: 'One or more products are no longer available' },
        { status: 400 }
      )
    }

    const unitAmount = Math.round(parseFloat(found.variant.retail_price) * 100)
    if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
      return NextResponse.json({ error: 'Product price unavailable' }, { status: 502 })
    }

    lineItems.push({
      price_data: {
        currency: found.variant.currency.toLowerCase(),
        product_data: {
          name: found.productName,
          description: found.variant.name,
          ...(item.imageUrl && item.imageUrl.startsWith('http') ? { images: [item.imageUrl] } : {}),
        },
        unit_amount: unitAmount,
      },
      quantity: item.quantity,
    })

    cartMeta.push({
      variantId: item.variantId,
      quantity: item.quantity,
      productName: found.productName,
      variantName: found.variant.name,
    })

    rateItems.push({ variant_id: found.variant.variant_id, quantity: item.quantity })
  }

  // Recompute shipping server-side and use the rate matching the client's choice.
  let shippingOption: NonNullable<CheckoutParams['shipping_options']>[number]
  try {
    const rates = await getShippingRates(
      { address1: addr.line1, city: addr.city, country_code: addr.country, zip: addr.postalCode },
      rateItems
    )
    const rate = rates.find((r) => r.id === shippingRateId)
    if (!rate) {
      return NextResponse.json(
        { error: 'The selected shipping option is no longer available' },
        { status: 400 }
      )
    }
    const shippingAmount = Math.round(parseFloat(rate.rate) * 100)
    if (!Number.isFinite(shippingAmount) || shippingAmount < 0) {
      return NextResponse.json({ error: 'Shipping cost unavailable' }, { status: 502 })
    }
    shippingOption = {
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: { amount: shippingAmount, currency: rate.currency.toLowerCase() },
        display_name: sanitizeDisplayName(rate.name),
        ...(Number.isInteger(rate.minDeliveryDays) && Number.isInteger(rate.maxDeliveryDays)
          ? {
              delivery_estimate: {
                minimum: { unit: 'business_day', value: rate.minDeliveryDays! },
                maximum: { unit: 'business_day', value: rate.maxDeliveryDays! },
              },
            }
          : {}),
      },
    }
  } catch (err) {
    console.error('[Checkout] Failed to resolve shipping rate:', err)
    return NextResponse.json({ error: 'Could not calculate shipping' }, { status: 502 })
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

  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '')

  try {
    const sessionParams: CheckoutParams = {
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      shipping_options: [shippingOption],
      metadata: {
        cart: cartJson,
        ship_addr: JSON.stringify(addr),
        ship_method: shippingRateId,
        ...(user ? { user_id: user.id } : {}),
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

    const session = await stripe.checkout.sessions.create(sessionParams)
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[Stripe] checkout session creation failed:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
