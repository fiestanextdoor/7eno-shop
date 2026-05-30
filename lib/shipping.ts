export const ALLOWED_COUNTRIES = ['NL', 'BE', 'DE', 'FR', 'GB'] as const

export type AllowedCountry = (typeof ALLOWED_COUNTRIES)[number]

export const COUNTRY_NAMES: Record<AllowedCountry, string> = {
  NL: 'Nederland',
  BE: 'België',
  DE: 'Duitsland',
  FR: 'Frankrijk',
  GB: 'Verenigd Koninkrijk',
}

// Flat-rate shipping strategy: one fixed fee for every order, waived once the
// product subtotal reaches the free-shipping threshold. We charge the customer
// this flat amount regardless of Printful's real per-item cost; that gap is a
// deliberate margin/conversion decision, not a calculation. All amounts are in
// cents to avoid floating-point rounding on the money path.
export const FREE_SHIPPING_THRESHOLD_CENTS = 7500 // €75,00
export const FLAT_SHIPPING_RATE_CENTS = 495 // €4,95
export const FREE_SHIPPING_THRESHOLD = FREE_SHIPPING_THRESHOLD_CENTS / 100
export const FLAT_SHIPPING_RATE = FLAT_SHIPPING_RATE_CENTS / 100

/**
 * The customer-facing shipping fee in cents for a given product subtotal (also
 * in cents). Free at or above FREE_SHIPPING_THRESHOLD_CENTS, otherwise the flat
 * rate. The single source of truth for both the checkout UI and the server, so
 * the displayed price and the charged price can never drift apart.
 */
export function computeShippingCents(subtotalCents: number): number {
  if (!Number.isFinite(subtotalCents) || subtotalCents <= 0) return FLAT_SHIPPING_RATE_CENTS
  return subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_RATE_CENTS
}

export interface ShippingAddress {
  name: string
  line1: string
  line2?: string
  city: string
  postalCode: string
  country: AllowedCountry
}

type ValidationResult =
  | { ok: true; address: ShippingAddress }
  | { ok: false; error: string }

function isAllowedCountry(value: unknown): value is AllowedCountry {
  return typeof value === 'string' && (ALLOWED_COUNTRIES as readonly string[]).includes(value)
}

/**
 * Validates a raw shipping address from the client. Trims string fields and
 * enforces the supported country list. State/province is intentionally not
 * required: only US/CA/AU need it, which are not in ALLOWED_COUNTRIES.
 */
export function validateShippingAddress(input: unknown): ValidationResult {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, error: 'Address is required' }
  }

  const raw = input as Record<string, unknown>
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

  const name = str(raw.name)
  const line1 = str(raw.line1)
  const line2 = str(raw.line2)
  const city = str(raw.city)
  const postalCode = str(raw.postalCode)
  const country = raw.country

  if (!name) return { ok: false, error: 'Name is required' }
  if (!line1) return { ok: false, error: 'Address line is required' }
  if (!city) return { ok: false, error: 'City is required' }
  if (!postalCode) return { ok: false, error: 'Postal code is required' }
  if (!isAllowedCountry(country)) {
    return { ok: false, error: 'We do not ship to the selected country' }
  }

  return {
    ok: true,
    address: {
      name,
      line1,
      ...(line2 ? { line2 } : {}),
      city,
      postalCode,
      country,
    },
  }
}
