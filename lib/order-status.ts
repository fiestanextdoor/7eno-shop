import type { Fulfillment } from './supabase/types'

/**
 * Vertaalt zowel de grove top-level order.status als de fijnere
 * provider-fulfillment-status naar iets dat de UI kan tonen: een label, een
 * kleur-tone en een stap in de voortgangsbalk. Gedeeld door de orders-pagina en
 * het dashboard zodat de status-woordenschat op één plek staat.
 */

export type StatusTone = 'default' | 'green' | 'red' | 'amber'

export interface StatusMeta {
  label: string
  tone: StatusTone
  /** Positie in STEP_LABELS: 0 ordered, 1 in production, 2 shipped, 3 delivered. */
  step: number
}

export const STEP_LABELS = ['Ordered', 'In production', 'Shipped', 'Delivered']

const META: Record<string, StatusMeta> = {
  processing: { label: 'Processing', tone: 'default', step: 0 },
  pending: { label: 'Processing', tone: 'default', step: 0 },
  on_hold: { label: 'On hold', tone: 'amber', step: 0 },
  in_production: { label: 'In production', tone: 'default', step: 1 },
  partially_shipped: { label: 'Partially shipped', tone: 'default', step: 2 },
  shipped: { label: 'Shipped', tone: 'green', step: 2 },
  fulfilled: { label: 'Shipped', tone: 'green', step: 2 },
  completed: { label: 'Completed', tone: 'green', step: 3 },
  delivered: { label: 'Delivered', tone: 'green', step: 3 },
  cancelled: { label: 'Cancelled', tone: 'red', step: 0 },
  failed: { label: 'Needs attention', tone: 'red', step: 0 },
  fulfillment_failed: { label: 'Needs attention', tone: 'red', step: 0 },
}

export function statusMeta(status: string): StatusMeta {
  return META[status] ?? { label: status, tone: 'default', step: 0 }
}

// Voortgangsrang: hoe hoger, hoe verder in het proces. Negatief = probleemstaat.
const RANK: Record<string, number> = {
  failed: -2,
  fulfillment_failed: -2,
  cancelled: -1,
  pending: 0,
  processing: 0,
  on_hold: 1,
  in_production: 2,
  partially_shipped: 3,
  shipped: 4,
  fulfilled: 4,
  completed: 5,
  delivered: 5,
}

const rankOf = (status: string): number => RANK[status] ?? 0

/**
 * Voortgangsrang van een status (hoger = verder in het proces, negatief =
 * probleemstaat). Gebruikt door webhooks om te voorkomen dat out-of-order events
 * een order terugzetten (bijv. een late order_updated ná package_shipped).
 */
export function statusRank(status: string): number {
  return rankOf(status)
}

/** Terminale probleemstatussen die altijd gezet mogen worden, ook "achteruit". */
export function isTerminalStatus(status: string): boolean {
  return status === 'cancelled' || status === 'failed'
}

/**
 * Bepaalt één status voor een order op basis van al zijn fulfillments. Een order
 * is pas "verzonden" als alle onderdelen minstens verzonden zijn, dus we tonen de
 * minst-gevorderde actieve fulfillment. Een mislukte fulfillment (of een
 * top-level fulfillment_failed) wint altijd zodat de klant het probleem ziet.
 */
export function deriveOrderStatus(fulfillments: Fulfillment[], fallback: string): StatusMeta {
  if (!fulfillments.length) return statusMeta(fallback)
  if (fallback === 'fulfillment_failed' || fulfillments.some((f) => rankOf(f.status) === -2)) {
    return statusMeta('failed')
  }
  const active = fulfillments.filter((f) => f.status !== 'cancelled')
  if (!active.length) return statusMeta('cancelled')
  const least = active.reduce((a, b) => (rankOf(a.status) <= rankOf(b.status) ? a : b))
  return statusMeta(least.status)
}
