import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createOrder, type PrintfulOrderRecipient, type PrintfulOrderItem } from '@/lib/printful'
import { createServiceClient } from '@/lib/supabase/server'

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

    const customer = session.customer_details
    if (!customer) {
      console.error('[Webhook] Missing customer details on session', session.id)
      return NextResponse.json({ error: 'Missing customer information' }, { status: 400 })
    }

    // The shipping address is collected on our own checkout page and passed via
    // metadata (Stripe's address step is disabled), so it is the source of truth.
    let shipAddr: { name: string; line1: string; line2?: string; city: string; postalCode: string; country: string } | null
    try {
      shipAddr = session.metadata?.ship_addr ? JSON.parse(session.metadata.ship_addr) : null
    } catch {
      shipAddr = null
    }
    if (!shipAddr?.line1 || !shipAddr.city || !shipAddr.country) {
      console.error('[Webhook] Missing/invalid shipping address metadata on session', session.id)
      return NextResponse.json({ error: 'Missing shipping information' }, { status: 400 })
    }

    const shipMethod = session.metadata?.ship_method || undefined

    let cartItems: { variantId: number; quantity: number; productName?: string; variantName?: string }[]
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

    const supabase = await createServiceClient()
    const userId = session.metadata?.user_id ?? null

    // Idempotency: Stripe retries webhooks. If this session was already fulfilled,
    // do not create a second Printful order.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase.from('orders') as any)
      .select('printful_order_id')
      .eq('stripe_session_id', session.id)
      .maybeSingle()
    if (existing?.printful_order_id) {
      return NextResponse.json({ received: true, alreadyProcessed: true })
    }

    const recipient: PrintfulOrderRecipient = {
      name: shipAddr.name || customer.name || 'Customer',
      email: customer.email ?? '',
      address1: shipAddr.line2 ? `${shipAddr.line1}, ${shipAddr.line2}` : shipAddr.line1,
      city: shipAddr.city,
      state_code: '',
      country_code: shipAddr.country,
      zip: shipAddr.postalCode,
    }

    const items: PrintfulOrderItem[] = cartItems.map((i) => ({
      sync_variant_id: i.variantId,
      quantity: i.quantity,
    }))

    let printfulOrderId: string | null = null
    let fulfillmentError: unknown = null
    try {
      const printfulOrder = await createOrder(recipient, items, shipMethod) as unknown as { id?: number | string } | null
      printfulOrderId = String(printfulOrder?.id ?? '')
      console.log('[Webhook] Printful order created for session', session.id)
    } catch (err) {
      fulfillmentError = err
      console.error('[Webhook] Printful order creation failed:', err)
    }

    // Persist the order regardless of fulfillment outcome so a paid order is
    // never lost. A failed fulfillment is recorded for manual follow-up/refund.
    let persisted = false
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('orders') as any).upsert({
        user_id: userId,
        stripe_session_id: session.id,
        printful_order_id: printfulOrderId,
        status: fulfillmentError ? 'fulfillment_failed' : 'processing',
        total_amount: session.amount_total ?? 0,
        currency: session.currency ?? 'eur',
        items: cartItems.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
          productName: i.productName ?? '',
          variantName: i.variantName ?? '',
        })),
        shipping_address: {
          name: recipient.name,
          line1: recipient.address1,
          city: recipient.city,
          postal_code: recipient.zip,
          country: recipient.country_code,
        },
      }, { onConflict: 'stripe_session_id' })
      persisted = true

      // Save Stripe customer ID to profile if user is logged in
      if (userId && session.customer) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('profiles') as any)
          .update({ stripe_customer_id: String(session.customer) })
          .eq('id', userId)
      }
    } catch (err) {
      console.error('[Webhook] Failed to save order to Supabase for session', session.id, err)
    }

    if (fulfillmentError) {
      // Could not fulfill. The order record exists with status 'fulfillment_failed'.
      // Return 500 so Stripe retries: a transient Printful error may succeed on a
      // later attempt, and the idempotency guard above prevents duplicate orders.
      return NextResponse.json({ error: 'Fulfillment failed, will retry' }, { status: 500 })
    }

    if (!persisted) {
      // Fulfilled in Printful but the DB record failed. Do NOT return an error
      // (that would retry fulfillment and duplicate the Printful order); log for
      // manual reconciliation instead.
      console.error('[Webhook] CRITICAL: Printful order', printfulOrderId, 'created but not recorded for session', session.id)
    }
  }

  return NextResponse.json({ received: true })
}
