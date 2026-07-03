import crypto from 'crypto'

/**
 * De Printful (legacy) webhook-API tekent de payload niet met een HMAC-signature
 * zoals Stripe/Printify dat doen. De gangbare beveiliging is een geheim token in
 * de webhook-URL (`?token=...`) dat we hier constant-time vergelijken. Als er
 * geen secret is geconfigureerd accepteren we de request (degraded mode), net als
 * de Printify-handler, zodat statusupdates al werken voor het secret gekoppeld is.
 */
export function verifyPrintfulToken(token: string | null, secret: string): boolean {
  if (!secret) return true
  if (!token) return false
  const a = Buffer.from(token)
  const b = Buffer.from(secret)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

/**
 * Vertaalt een Printful-webhook (event-type + optioneel de order.status uit de
 * payload) naar onze interne fulfillment-status. De statuswaarden komen uit de
 * Printful order-API: draft, pending, onhold, inprocess, partial, fulfilled,
 * canceled, failed.
 */
export function mapPrintfulStatus(type: string, orderStatus?: string): string {
  if (type === 'package_shipped') return 'shipped'
  if (type === 'order_canceled') return 'cancelled'
  if (type === 'order_failed') return 'failed'
  switch (orderStatus) {
    case 'draft':
    case 'pending':
      return 'pending'
    case 'onhold':
      return 'on_hold'
    case 'inprocess':
      return 'in_production'
    case 'partial':
      return 'partially_shipped'
    case 'fulfilled':
      return 'shipped'
    case 'canceled':
      return 'cancelled'
    case 'failed':
      return 'failed'
    default:
      // order_created / order_updated zonder herkende status: order loopt.
      return 'in_production'
  }
}

export interface ExtractedShipment {
  carrier: string
  tracking_number: string
  tracking_url: string
  shipped_at: string | null
}

interface ShipmentLike {
  carrier?: string
  tracking_number?: string
  tracking_url?: string
  ship_date?: string
  shipped_at?: number
}

/**
 * Haalt de tracking-gegevens uit de `data` van een package_shipped-payload.
 * Printful kan de shipment op meerdere plekken leveren, dus we accepteren zowel
 * `data.shipment` (enkelvoud) als een `shipments[]`-array en de shipments op de
 * order zelf. Geeft null terug als er geen shipment met tracking-nummer is (dan
 * is er niets te tonen). `ship_date` is een datumstring; `shipped_at` een
 * unix-seconde timestamp als fallback.
 */
export function extractShipment(data: {
  shipment?: ShipmentLike
  shipments?: ShipmentLike[]
  order?: { shipments?: ShipmentLike[] }
}): ExtractedShipment | null {
  const s = data?.shipment ?? data?.shipments?.[0] ?? data?.order?.shipments?.[0]
  if (!s || !s.tracking_number) return null
  return {
    carrier: s.carrier ?? '',
    tracking_number: s.tracking_number,
    tracking_url: s.tracking_url ?? '',
    shipped_at: s.ship_date ?? (s.shipped_at ? new Date(s.shipped_at * 1000).toISOString() : null),
  }
}
