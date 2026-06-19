import type { Resend } from 'resend'

/**
 * Thin wrapper around Resend for transactional email.
 *
 * Configuration is read from the environment so the rest of the app never
 * touches the SDK directly:
 *   - RESEND_API_KEY    the Resend API key (required to actually send)
 *   - ORDER_EMAIL_FROM  the verified sender, e.g. "7ENO <orders@7eno.shop>"
 *
 * Sending is best-effort by design: when the key/sender is missing the call
 * is skipped (logged, not thrown) so a misconfiguration never breaks the flow
 * that triggered it (e.g. the Stripe webhook must still 200 a paid order).
 */

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  /** Blind copy, e.g. the shop's own order inbox. */
  bcc?: string | string[]
  /** Defaults to ORDER_EMAIL_FROM. */
  from?: string
  /** Where customer replies should land (defaults to the sender). */
  replyTo?: string
}

export interface SendEmailResult {
  ok: boolean
  id?: string
  error?: string
  /** True when sending was skipped because email is not configured. */
  skipped?: boolean
}

let cachedClient: Resend | null = null

// Resend is imported lazily (only when a key is present and we actually send)
// so that pure helpers like renderOrderConfirmation — and their tests — never
// pull the SDK into the bundle/runtime.
async function getClient(): Promise<Resend | null> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  if (!cachedClient) {
    const { Resend } = await import('resend')
    cachedClient = new Resend(apiKey)
  }
  return cachedClient
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const client = await getClient()
  const from = options.from ?? process.env.ORDER_EMAIL_FROM

  if (!client || !from) {
    console.warn(
      '[Email] Skipped sending "%s": missing %s',
      options.subject,
      !client ? 'RESEND_API_KEY' : 'ORDER_EMAIL_FROM'
    )
    return { ok: false, skipped: true, error: 'Email not configured' }
  }

  try {
    const { data, error } = await client.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      ...(options.text ? { text: options.text } : {}),
      ...(options.bcc ? { bcc: options.bcc } : {}),
      ...(options.replyTo ? { replyTo: options.replyTo } : {}),
    })

    if (error) {
      console.error('[Email] Resend rejected "%s":', options.subject, error)
      return { ok: false, error: error.message }
    }
    return { ok: true, id: data?.id }
  } catch (err) {
    console.error('[Email] Failed to send "%s":', options.subject, err)
    return { ok: false, error: (err as Error).message }
  }
}
