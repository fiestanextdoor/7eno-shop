import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createOrder, type PrintfulOrderRecipient, type PrintfulOrderItem } from '@/lib/printful'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[Webhook] STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  let event: import('stripe').Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err)
    return NextResponse.json(
      { error: `Webhook signature invalid: ${(err as Error).message}` },
      { status: 400 }
    )
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as import('stripe').Stripe.Checkout.Session

    const shipping = session.collected_information?.shipping_details
    const customer = session.customer_details

    if (!shipping?.address || !customer) {
      console.error('[Webhook] Missing shipping/customer details on session', session.id)
      return NextResponse.json({ error: 'Missing shipping information' }, { status: 400 })
    }

    let cartItems: { variantId: number; quantity: number }[]
    try {
      cartItems = JSON.parse(session.metadata?.cart ?? '[]')
    } catch {
      console.error('[Webhook] Failed to parse cart metadata on session', session.id)
      return NextResponse.json({ error: 'Invalid cart metadata' }, { status: 400 })
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      console.error('[Webhook] Empty cart metadata on session', session.id)
      return NextResponse.json({ error: 'Empty cart in metadata' }, { status: 400 })
    }

    const recipient: PrintfulOrderRecipient = {
      name: shipping.name ?? customer.name ?? 'Customer',
      email: customer.email ?? '',
      address1: shipping.address.line1 ?? '',
      city: shipping.address.city ?? '',
      state_code: shipping.address.state ?? '',
      country_code: shipping.address.country ?? 'NL',
      zip: shipping.address.postal_code ?? '',
    }

    const items: PrintfulOrderItem[] = cartItems.map((i) => ({
      sync_variant_id: i.variantId,
      quantity: i.quantity,
    }))

    try {
      await createOrder(recipient, items)
      console.log('[Webhook] Printful order created for session', session.id)
    } catch (err) {
      console.error('[Webhook] Printful order creation failed:', err)
      // Return 500 so Stripe retries the webhook
      return NextResponse.json({ error: 'Printful order creation failed' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
