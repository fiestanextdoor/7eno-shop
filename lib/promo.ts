/**
 * Single source of truth for the storefront discount codes.
 *
 * A code is single-use *per account*: redemption is recorded in the
 * `coupon_redemptions` table once an order is paid (Stripe webhook), and both
 * the validation endpoint and the checkout route refuse a code the signed-in
 * user has already redeemed. Codes cannot be combined with bundle/package deals.
 *
 * Let op: een code is niet aan één klant gebonden. Iedereen die hem kent kan hem
 * gebruiken, eenmalig per account. Deel een goodwill-code dus persoonlijk.
 */
export interface PromoCode {
  /** Canonical (uppercase) code the shopper types in. */
  code: string
  /** Percentage off the product subtotal (shipping excluded). */
  percentOff: number
  /** Waives the shipping fee regardless of the subtotal. */
  freeShipping: boolean
}

export const PROMO_CODES: readonly PromoCode[] = [
  { code: 'MAARDANWEL', percentOff: 7, freeShipping: false },
  // Goodwill-code, persoonlijk uitgedeeld. Bewust een nietszeggende reeks: de
  // klant hoeft in de code niet te lezen dat het een excuus is. Geen 0/O/1/I/L,
  // die worden bij het overtypen verwisseld.
  { code: '7ENO-ZGSEA', percentOff: 15, freeShipping: true },
]

/** Uppercase + trim so "  maardanwel " matches the canonical code. */
export function normalizePromoCode(input: string): string {
  return input.trim().toUpperCase()
}

/**
 * Vergelijkvorm van een code: hoofdletters zonder spaties en streepjes. Codes
 * worden met de hand overgetypt en het streepje in "7ENO-ZGSEA" wordt daarbij
 * net zo vaak vergeten als meegetypt. Beide moeten werken, anders lijkt een
 * geldige code kapot.
 */
function comparableCode(input: string): string {
  return normalizePromoCode(input).replace(/[\s-]+/g, '')
}

/** The matching code, or null when the input is not a known code. */
export function findPromoCode(input: string): PromoCode | null {
  const needle = comparableCode(input)
  if (needle === '') return null
  return PROMO_CODES.find((promo) => comparableCode(promo.code) === needle) ?? null
}

/** True when the input resolves to one of the supported discount codes. */
export function isValidPromoCode(input: string): boolean {
  return findPromoCode(input) !== null
}
