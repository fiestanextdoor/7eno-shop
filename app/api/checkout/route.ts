import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import type { CartItem } from '@/types/cart'

export async function POST(req: NextRequest) {
  let items: CartItem[]
  try {
    const body = await req.json()
    items = body.items
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }

  if (items.some((i) => isNaN(parseFloat(i.price)))) {
    return NextResponse.json({ error: 'Invalid item price' }, { status: 400 })
  }

  const cartJson = JSON.stringify(
    items.map((i) => ({
      variantId: i.variantId,
      quantity: i.quantity,
      productName: i.productName,
      variantName: i.variantName,
      price: i.price,
    }))
  )
  if (cartJson.length > 2000) {
    return NextResponse.json(
      { error: 'Cart too large. Please contact support.' },
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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

  try {
    const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: items.map((item) => ({
        price_data: {
          currency: item.currency.toLowerCase(),
          product_data: {
            name: item.productName,
            description: item.variantName,
            ...(item.imageUrl && item.imageUrl.startsWith('http') ? { images: [item.imageUrl] } : {}),
          },
          unit_amount: Math.round(parseFloat(item.price) * 100),
        },
        quantity: item.quantity,
      })),
      shipping_address_collection: {
        allowed_countries: ['NL', 'BE', 'DE', 'FR', 'GB'],
      },
      metadata: {
        cart: cartJson,
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
