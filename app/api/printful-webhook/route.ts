import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyPrintfulToken, mapPrintfulStatus, extractShipment } from '@/lib/printful-webhook'
import { statusRank, isTerminalStatus } from '@/lib/order-status'
import { sendOrderShippedEmail } from '@/lib/email/order-shipped'
import type { Fulfillment } from '@/lib/supabase/types'

// Printful stuurt deze events; alles daarbuiten negeren we (200) zodat Printful
// niet blijft retryen op events die ons niet aangaan.
const HANDLED = new Set(['package_shipped', 'order_updated', 'order_created', 'order_canceled', 'order_failed'])

export async function POST(req: NextRequest) {
  // Printful tekent de payload niet; we verifiëren een geheim token uit de URL.
  const token = new URL(req.url).searchParams.get('token')
  const secret = process.env.PRINTFUL_WEBHOOK_SECRET ?? ''
  if (!verifyPrintfulToken(token, secret)) {
    console.error('[PrintfulWebhook] Token verification failed')
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  const body = await req.text()
  type ShipmentLike = {
    carrier?: string
    tracking_number?: string
    tracking_url?: string
    ship_date?: string
    shipped_at?: number
  }
  let payload: {
    type?: string
    data?: {
      order?: { id?: number | string; external_id?: string; status?: string; shipments?: ShipmentLike[] }
      shipment?: ShipmentLike
      shipments?: ShipmentLike[]
    }
  }
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const type = payload.type ?? ''
  if (!HANDLED.has(type)) {
    return NextResponse.json({ received: true, ignored: true })
  }

  const order = payload.data?.order
  const externalId = order?.external_id
  const printfulOrderId = order?.id != null ? String(order.id) : null
  if (!externalId && !printfulOrderId) {
    return NextResponse.json({ received: true, unmatched: true })
  }

  const supabase = await createServiceClient()

  // Match op external_id (= Stripe session id) als die er is, anders op het
  // opgeslagen Printful order-id.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const base = (supabase.from('orders') as any).select(
    'id, fulfillments, customer_email, printful_order_id, stripe_session_id, shipping_address'
  )
  const { data: row } = externalId
    ? await base.eq('stripe_session_id', externalId).maybeSingle()
    : await base.eq('printful_order_id', printfulOrderId).maybeSingle()

  if (!row) {
    console.warn('[PrintfulWebhook] No order row for', externalId ?? printfulOrderId)
    return NextResponse.json({ received: true, unmatched: true })
  }

  const fulfillments: Fulfillment[] = Array.isArray(row.fulfillments) ? row.fulfillments : []
  const mappedStatus = mapPrintfulStatus(type, order?.status)
  const shipment = extractShipment(payload.data ?? {})

  // De verzend-mail hangt aan het eerste moment dat tracking binnenkomt, niet aan
  // de status. Printful kan namelijk order_updated(fulfilled) vóór package_shipped
  // sturen; zou de mail aan de status "shipped" hangen, dan zou de tracking-mail
  // daarna onterecht worden overgeslagen. Zo sturen we exact één keer, wanneer we
  // voor het eerst een tracking-nummer hebben.
  const existing = fulfillments.find((f) => f.provider === 'printful')
  const hadTracking = Boolean(existing?.tracking_number)

  // Nooit terugvallen: een late/out-of-order event mag een verder gevorderde
  // status niet verlagen (bijv. order_updated zonder status na package_shipped
  // zou anders 'shipped' → 'in_production' terugzetten). Terminale
  // probleemstatussen (cancelled/failed) mogen wél altijd gezet worden.
  const status =
    existing?.status && !isTerminalStatus(mappedStatus) && statusRank(mappedStatus) < statusRank(existing.status)
      ? existing.status
      : mappedStatus

  const trackingPatch = shipment
    ? {
        carrier: shipment.carrier,
        tracking_number: shipment.tracking_number,
        tracking_url: shipment.tracking_url,
        shipped_at: shipment.shipped_at,
      }
    : {}

  // Werk de bestaande printful-entry bij; ontbreekt die (nog), voeg 'm toe zodat
  // status/tracking nooit stil verdwijnt.
  let touched = false
  const updated: Fulfillment[] = fulfillments.map((f) => {
    if (f.provider !== 'printful') return f
    touched = true
    return { ...f, status, ...trackingPatch }
  })
  if (!touched) {
    updated.push({ provider: 'printful', order_id: printfulOrderId ?? '', status, ...trackingPatch })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('orders') as any).update({ fulfillments: updated }).eq('id', row.id)

  // Verzend-mail zodra we voor het eerst tracking hebben. Best-effort: een
  // mailfout mag de webhook nooit laten falen (anders blijft Printful retryen).
  if (shipment && !hadTracking && row.customer_email) {
    try {
      const ship = (row.shipping_address ?? {}) as {
        name?: string
        line1?: string
        city?: string
        postal_code?: string
        country?: string
      }
      await sendOrderShippedEmail(row.customer_email, {
        orderRef: row.printful_order_id || String(row.stripe_session_id).slice(-12),
        customerName: ship.name ?? 'Customer',
        carrier: shipment.carrier,
        trackingNumber: shipment.tracking_number,
        trackingUrl: shipment.tracking_url,
        shippingAddress: {
          name: ship.name ?? 'Customer',
          line1: ship.line1 ?? '',
          city: ship.city ?? '',
          postalCode: ship.postal_code ?? '',
          country: ship.country ?? '',
        },
      })
    } catch (err) {
      console.error('[PrintfulWebhook] Failed to send shipment email for order', row.id, err)
    }
  }

  return NextResponse.json({ received: true })
}
