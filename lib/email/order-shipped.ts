import { sendEmail, type SendEmailResult } from './send'

export interface ShippedEmailData {
  /** Human-facing reference, e.g. the fulfillment order id or a short code. */
  orderRef: string
  customerName: string
  carrier: string
  trackingNumber: string
  trackingUrl: string
  shippingAddress: {
    name: string
    line1: string
    city: string
    postalCode: string
    country: string
  }
}

// ── Brand palette (mirrors styles/globals.css) ──────────────────────────────
const INK = '#111111'
const BONE = '#F6F3EC'
const PAPER = '#EDE8DD'
const OXBLOOD = '#5C1A1B'
const STONE = '#8A8275'
const RULE = '#C8C1B2'
const SERIF = "Georgia, 'Times New Roman', Times, serif"
const MONO = "'Courier New', Courier, monospace"

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function firstName(fullName: string): string {
  const token = fullName.trim().split(/\s+/)[0]
  return token || 'there'
}

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

export function renderOrderShipped(data: ShippedEmailData): RenderedEmail {
  const subject = 'Your 7ENO order is on its way'

  // Email clients can't resolve relative URLs, so logos need an absolute origin.
  // Mirrors the order-confirmation handling, production domain as fallback.
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://www.7eno.shop').replace(/\/+$/, '')

  const addr = data.shippingAddress
  const addressHtml = [addr.name, addr.line1, `${addr.postalCode} ${addr.city}`, addr.country]
    .filter(Boolean)
    .map((line) => escapeHtml(line))
    .join('<br />')

  const carrierLine = data.carrier
    ? `<span style="color:${STONE};">${escapeHtml(data.carrier)}</span> &middot; `
    : ''

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light only" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:${PAPER};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:${BONE};border:1px solid ${RULE};">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:40px 40px 8px;">
              <img src="${baseUrl}/logos/woordmerk-ink.png" width="180" height="138" alt="7ENO" style="display:block;border:0;margin:0 auto;max-width:100%;" />
              <div style="font-family:${MONO};font-size:10px;letter-spacing:4px;text-transform:uppercase;color:${OXBLOOD};margin-top:12px;">Shipped</div>
            </td>
          </tr>
          <!-- Greeting -->
          <tr>
            <td style="padding:24px 40px 0;">
              <h1 style="margin:0 0 12px;font-family:${SERIF};font-style:italic;font-weight:600;font-size:26px;color:${INK};">On its way, ${escapeHtml(firstName(data.customerName))}.</h1>
              <p style="margin:0;font-family:${SERIF};font-size:16px;line-height:1.6;color:${INK};">
                Your order has shipped. Reference
                <span style="font-family:${MONO};font-size:13px;color:${OXBLOOD};">${escapeHtml(data.orderRef)}</span>.
              </p>
            </td>
          </tr>
          <!-- Tracking -->
          <tr>
            <td style="padding:24px 40px 0;">
              <div style="font-family:${MONO};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${STONE};margin-bottom:8px;">Tracking</div>
              <p style="margin:0 0 16px;font-family:${MONO};font-size:14px;color:${INK};">
                ${carrierLine}<span style="color:${OXBLOOD};">${escapeHtml(data.trackingNumber)}</span>
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:${INK};">
                    <a href="${escapeHtml(data.trackingUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;font-family:${MONO};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BONE};text-decoration:none;">Track your package &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Shipping address -->
          <tr>
            <td style="padding:24px 40px 0;">
              <div style="font-family:${MONO};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${STONE};margin-bottom:8px;">Shipping to</div>
              <p style="margin:0;font-family:${SERIF};font-size:15px;line-height:1.6;color:${INK};">${addressHtml}</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding:28px 40px 40px;">
              <hr style="border:none;border-top:1px solid ${RULE};margin:0 0 20px;" />
              <img src="${baseUrl}/logos/beeldmerk-zwart.png" width="34" height="35" alt="" style="display:block;border:0;margin:0 auto 12px;" />
              <p style="margin:0;font-family:${MONO};font-size:11px;line-height:1.7;color:${STONE};text-align:center;">
                7ENO &middot; Divine Authority<br />
                Questions about your order? Just reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = [
    '7ENO — SHIPPED',
    '',
    `On its way, ${firstName(data.customerName)}.`,
    `Your order has shipped. Reference ${data.orderRef}.`,
    '',
    'TRACKING',
    `${data.carrier ? `${data.carrier} · ` : ''}${data.trackingNumber}`,
    `Track your package: ${data.trackingUrl}`,
    '',
    'SHIPPING TO',
    `${addr.name}`,
    `${addr.line1}`,
    `${addr.postalCode} ${addr.city}`,
    `${addr.country}`,
    '',
    'Questions about your order? Just reply to this email.',
    '7ENO · Divine Authority',
  ].join('\n')

  return { subject, html, text }
}

/**
 * Render and send the shipment notification to the customer, blind-copying the
 * shop inbox (ORDER_EMAIL_BCC) when configured. Best-effort: returns the result
 * instead of throwing, so the webhook never fails over an email hiccup.
 */
export async function sendOrderShippedEmail(
  to: string,
  data: ShippedEmailData
): Promise<SendEmailResult> {
  const { subject, html, text } = renderOrderShipped(data)
  const bcc = process.env.ORDER_EMAIL_BCC || undefined
  return sendEmail({ to, subject, html, text, bcc })
}
