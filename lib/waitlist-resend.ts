import type { WaitlistSignup } from '@/lib/waitlist'

export type WaitlistResult = 'added' | 'unconfigured' | 'failed'

/**
 * Adds the address to the Resend audience in RESEND_WAITLIST_AUDIENCE_ID,
 * with the drop or product as a contact property. No Supabase involved
 * (spec section 4). Resend is imported lazily so tests and builds without
 * a key never load the SDK.
 */
export async function addWaitlistContact(signup: WaitlistSignup): Promise<WaitlistResult> {
  const apiKey = process.env.RESEND_API_KEY
  const audienceId = process.env.RESEND_WAITLIST_AUDIENCE_ID
  if (!apiKey || !audienceId) {
    console.warn('[Waitlist] Skipped: missing %s', !apiKey ? 'RESEND_API_KEY' : 'RESEND_WAITLIST_AUDIENCE_ID')
    return 'unconfigured'
  }

  const properties: Record<string, string> = {}
  if (signup.dropId) properties.drop_id = signup.dropId
  if (signup.productSlug) properties.product_slug = signup.productSlug

  try {
    const { Resend } = await import('resend')
    const client = new Resend(apiKey)
    const { error } = await client.contacts.create({
      audienceId,
      email: signup.email,
      unsubscribed: false,
      ...(Object.keys(properties).length > 0 ? { properties } : {}),
    })
    if (!error) return 'added'
    // Signing up twice is not an error for the visitor: they are on the list.
    if (/already exist/i.test(error.message)) return 'added'
    console.error('[Waitlist] Resend rejected the contact:', error.name, error.message)
    return 'failed'
  } catch (err) {
    console.error('[Waitlist] Resend request failed:', err)
    return 'failed'
  }
}
