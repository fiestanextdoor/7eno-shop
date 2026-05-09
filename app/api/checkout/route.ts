import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
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
    items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }))
  )
  if (cartJson.length > 500) {
    return NextResponse.json(
      { error: 'Cart too large. Please contact support.' },
      { status: 400 }
    )
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'ideal'],
      mode: 'payment',
      line_items: items.map((item) => ({
        price_data: {
          currency: item.currency.toLowerCase(),
          product_data: {
            name: item.productName,
            description: item.variantName,
            ...(item.imageUrl ? { images: [item.imageUrl] } : {}),
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
      },
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[Stripe] checkout session creation failed:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
