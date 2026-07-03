import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createOrder as createPrintfulOrder, isAutoConfirmEnabled as isPrintfulAutoConfirm, type PrintfulOrderRecipient, type PrintfulOrderItem } from '@/lib/printful'
import { createOrder as createPrintifyOrder, type PrintifyOrderRecipient, type PrintifyOrderLine } from '@/lib/printify'
import { createServiceClient } from '@/lib/supabase/server'
import { sendOrderConfirmationEmail, type OrderEmailItem } from '@/lib/email/order-confirmation'

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

    // Compact cart metadata: r=provider, p=productId, v=variantId, q=quantity.
    let cartItems: { r: 'printful' | 'printify'; p: string; v: string; q: number }[]
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

    // Idempotency: if we already recorded fulfillments for this session, stop.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase.from('orders') as any)
      .select('fulfillments')
      .eq('stripe_session_id', session.id)
      .maybeSingle()
    if (existing?.fulfillments && Array.isArray(existing.fulfillments) && existing.fulfillments.length > 0) {
      return NextResponse.json({ received: true, alreadyProcessed: true })
    }

    const phone = customer.phone ?? ''

    // Printful recipient (single name, no phone needed).
    const printfulRecipient: PrintfulOrderRecipient = {
      name: shipAddr.name || customer.name || 'Customer',
      email: customer.email ?? '',
      address1: shipAddr.line2 ? `${shipAddr.line1}, ${shipAddr.line2}` : shipAddr.line1,
      city: shipAddr.city,
      state_code: '',
      country_code: shipAddr.country,
      zip: shipAddr.postalCode,
    }

    // Printify recipient (split name + phone).
    const printifyRecipient: PrintifyOrderRecipient = {
      name: shipAddr.name || customer.name || 'Customer',
      email: customer.email ?? '',
      phone,
      address1: shipAddr.line1,
      address2: shipAddr.line2 ?? '',
      city: shipAddr.city,
      country_code: shipAddr.country,
      zip: shipAddr.postalCode,
    }

    const pfItems: PrintfulOrderItem[] = cartItems
      .filter((i) => i.r === 'printful')
      .map((i) => ({ sync_variant_id: Number(i.v), quantity: i.q }))
    const piItems: PrintifyOrderLine[] = cartItems
      .filter((i) => i.r === 'printify')
      .map((i) => ({ productId: i.p, variantId: i.v, quantity: i.q }))

    const fulfillments: { provider: string; order_id: string; status: string }[] = []
    let fulfillmentError: unknown = null

    if (pfItems.length) {
      try {
        const order = await createPrintfulOrder(printfulRecipient, pfItems, session.id, shipMethod) as unknown as { id?: number | string }
        fulfillments.push({ provider: 'printful', order_id: String(order?.id ?? ''), status: 'processing' })
        console.log('[Webhook] Printful order created for session', session.id,
          isPrintfulAutoConfirm() ? '(auto-submitted)' : '(draft)')
      } catch (err) {
        fulfillmentError = err
        console.error('[Webhook] Printful order creation failed:', err)
      }
    }

    if (piItems.length) {
      try {
        const order = await createPrintifyOrder(printifyRecipient, piItems, session.id)
        fulfillments.push({ provider: 'printify', order_id: order.id, status: 'pending' })
        console.log('[Webhook] Printify order created for session', session.id)
      } catch (err) {
        fulfillmentError = err
        console.error('[Webhook] Printify order creation failed:', err)
      }
    }

    const printfulOrderId = fulfillments.find((f) => f.provider === 'printful')?.order_id ?? null

    // Persist the order regardless of fulfillment outcome so a paid order is
    // never lost. A failed fulfillment is recorded for manual follow-up/refund.
    let persisted = false
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('orders') as any).upsert({
        user_id: userId,
        stripe_session_id: session.id,
        printful_order_id: printfulOrderId,
        customer_email: customer.email ?? null,
        fulfillments,
        status: fulfillmentError ? 'fulfillment_failed' : 'processing',
        total_amount: session.amount_total ?? 0,
        currency: session.currency ?? 'eur',
        items: cartItems.map((i) => ({
          provider: i.r,
          productId: i.p,
          variantId: i.v,
          quantity: i.q,
        })),
        shipping_address: {
          name: printfulRecipient.name,
          line1: shipAddr.line2 ? `${shipAddr.line1}, ${shipAddr.line2}` : shipAddr.line1,
          city: shipAddr.city,
          postal_code: shipAddr.postalCode,
          country: shipAddr.country,
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

    // Record the discount-code redemption (single-use per account). Best-effort
    // and idempotent: the unique (user_id, code) constraint absorbs Stripe
    // retries. Only signed-in orders carry a promo_code (the code requires an
    // account), so userId is present whenever this runs.
    const promoCode = session.metadata?.promo_code
    if (promoCode && userId) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('coupon_redemptions') as any).upsert(
          { user_id: userId, code: promoCode, stripe_session_id: session.id },
          { onConflict: 'user_id,code', ignoreDuplicates: true }
        )
      } catch (err) {
        console.error('[Webhook] Failed to record promo redemption for session', session.id, err)
      }
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

    // Order confirmation email. Best-effort: a paid + fulfilled order must still
    // return 200, so any failure here is logged, never thrown. The idempotency
    // guard above ensures Stripe retries won't reach this twice.
    if (customer.email) {
      try {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
          expand: ['data.price.product'],
          limit: 100,
        })
        const items: OrderEmailItem[] = lineItems.data.map((li) => {
          const product = li.price?.product
          const variant =
            product && typeof product === 'object' && !('deleted' in product) ? product.description : null
          return {
            name: li.description ?? 'Item',
            variant: variant ?? null,
            quantity: li.quantity ?? 1,
            amountCents: li.amount_total ?? 0,
          }
        })

        await sendOrderConfirmationEmail(customer.email, {
          orderRef: printfulOrderId ?? fulfillments[0]?.order_id ?? session.id.slice(-12),
          customerName: printfulRecipient.name,
          items,
          subtotalCents: session.amount_subtotal ?? 0,
          shippingCents: session.total_details?.amount_shipping ?? 0,
          discountCents: session.total_details?.amount_discount ?? 0,
          totalCents: session.amount_total ?? 0,
          currency: session.currency ?? 'eur',
          shippingAddress: {
            name: printfulRecipient.name,
            line1: shipAddr.line2 ? `${shipAddr.line1}, ${shipAddr.line2}` : shipAddr.line1,
            city: shipAddr.city,
            postalCode: shipAddr.postalCode,
            country: shipAddr.country,
          },
        })
      } catch (err) {
        console.error('[Webhook] Failed to send confirmation email for session', session.id, err)
      }
    }
  }

  return NextResponse.json({ received: true })
}
