/**
 * Single source of truth for the storefront discount code.
 *
 * The code is single-use *per account*: redemption is recorded in the
 * `coupon_redemptions` table once an order is paid (Stripe webhook), and both
 * the validation endpoint and the checkout route refuse a code the signed-in
 * user has already redeemed. It cannot be combined with bundle/package deals.
 */
export const PROMO_CODE = 'MAARDANWEL'

/** Percentage off the product subtotal (shipping excluded). */
export const PROMO_PERCENT_OFF = 7

/** Uppercase + trim so "  maardanwel " matches the canonical code. */
export function normalizePromoCode(input: string): string {
  return input.trim().toUpperCase()
}

/** True when the input resolves to the one supported discount code. */
export function isValidPromoCode(input: string): boolean {
  return normalizePromoCode(input) === PROMO_CODE
}
