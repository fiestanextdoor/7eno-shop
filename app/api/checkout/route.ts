import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { buildVariantLookup } from '@/lib/printful'
import { validateShippingAddress, computeShippingCents } from '@/lib/shipping'
import { createClient } from '@/lib/supabase/server'
import type { CartItem } from '@/types/cart'

export async function POST(req: NextRequest) {
  let items: CartItem[]
  let address: unknown
  try {
    const body = await req.json()
    items = body.items
    address = body.address
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
  let subtotalCents = 0
  let currency = 'eur'

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

    currency = found.variant.currency.toLowerCase()
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

    cartMeta.push({
      variantId: item.variantId,
      quantity: item.quantity,
      productName: found.productName,
      variantName: found.variant.name,
    })
  }

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
