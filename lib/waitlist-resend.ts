import type { WaitlistSignup } from '@/lib/waitlist'

export type WaitlistResult = 'added' | 'unconfigured' | 'failed'

/**
 * Adds the address to the Resend audience in RESEND_WAITLIST_AUDIENCE_ID,
 * with the drop or product as a contact property (the properties drop_id and
 * product_slug must exist in Resend; without them the contact is stored bare).
 * No Supabase involved
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
    const base = { audienceId, email: signup.email, unsubscribed: false }
    const hasProperties = Object.keys(properties).length > 0
    let { error } = await client.contacts.create(hasProperties ? { ...base, properties } : base)
    if (error && hasProperties && /propert/i.test(error.message)) {
      // The custom properties are missing in the Resend account: never lose
      // the signup over that, store the bare contact instead.
      console.warn(
        '[Waitlist] Resend rejected the contact properties; create drop_id and product_slug (type string) in Resend. Retrying without them.',
      )
      ;({ error } = await client.contacts.create(base))
    }
    if (!error) return 'added'
    // Signing up twice is not an error for the visitor: they are on the list.
    // Resend answers a duplicate with a 409 or an "already exists" message.
    const status = (error as { statusCode?: number }).statusCode
    if (status === 409 || /already exist/i.test(error.message)) return 'added'
    // Log the kind of failure only: the message can carry the address.
    console.error('[Waitlist] Resend rejected the contact:', error.name, status ?? '')
    return 'failed'
  } catch (err) {
    console.error('[Waitlist] Resend request failed:', err)
    return 'failed'
  }
}
