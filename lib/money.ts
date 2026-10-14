const SYMBOLS: Record<string, string> = { EUR: '€', USD: '$', GBP: '£' }

/**
 * "€64.95" from cents. null for a missing or zero price, so a wrong price is
 * never shown. Safe in client components (no server imports).
 */
export function formatPrice(cents: number | undefined, currency: string): string | null {
  if (cents === undefined || !Number.isFinite(cents) || cents <= 0) return null
  return `${SYMBOLS[currency] ?? `${currency} `}${(cents / 100).toFixed(2)}`
}

/** "€4.95" for an amount in euro: cart and checkout totals, which may be 0. */
export function formatEuro(amount: number): string {
  return `€${(Number.isFinite(amount) ? amount : 0).toFixed(2)}`
}
