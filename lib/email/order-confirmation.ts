import { sendEmail, type SendEmailResult } from './send'
import {
  INK, BONE, SURFACE, ACCENT, ACCENT_INK, MUTED, RULE, DISPLAY, BODY, MONO,
  EMAIL_WORDMARK, EMAIL_MARK,
  escapeHtml, firstName, emailBaseUrl, type RenderedEmail,
} from './brand'

export interface OrderEmailItem {
  name: string
  variant?: string | null
  quantity: number
  /** Line total (unit price × quantity), in minor units. */
  amountCents: number
}

export interface OrderEmailData {
  /** Human-facing reference, e.g. the fulfillment order id or a short code. */
  orderRef: string
  customerName: string
  items: OrderEmailItem[]
  subtotalCents: number
  shippingCents: number
  discountCents: number
  totalCents: number
  currency: string
  shippingAddress: {
    name: string
    line1: string
    city: string
    postalCode: string
    country: string
  }
}

function formatMoney(cents: number, currency: string): string {
  const code = currency.toUpperCase()
  const symbol = code === 'EUR' ? '€' : code === 'USD' ? '$' : ''
  const amount = (cents / 100).toFixed(2)
  return symbol ? `${symbol}${amount}` : `${amount} ${code}`
}

function itemRowHtml(item: OrderEmailItem, currency: string): string {
  const variant = item.variant ? `<br /><span style="color:${MUTED};font-size:13px;">${escapeHtml(item.variant)}</span>` : ''
  return `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid ${RULE};font-family:${BODY};color:${INK};font-size:16px;">
        ${escapeHtml(item.name)}${variant}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid ${RULE};font-family:${MONO};color:${MUTED};font-size:13px;text-align:center;">
        ×${item.quantity}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid ${RULE};font-family:${MONO};color:${INK};font-size:14px;text-align:right;white-space:nowrap;">
        ${formatMoney(item.amountCents, currency)}
      </td>
    </tr>`
}

function totalRowHtml(label: string, value: string, opts: { strong?: boolean } = {}): string {
  const weight = opts.strong ? 'font-weight:700;' : ''
  const size = opts.strong ? '18px' : '14px'
  const color = opts.strong ? INK : MUTED
  return `
    <tr>
      <td style="padding:4px 0;font-family:${MONO};font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${color};">${escapeHtml(label)}</td>
      <td style="padding:4px 0;font-family:${MONO};font-size:${size};text-align:right;color:${INK};${weight}white-space:nowrap;">${escapeHtml(value)}</td>
    </tr>`
}

export function renderOrderConfirmation(data: OrderEmailData): RenderedEmail {
  const { currency } = data
  const subject = 'Your 7ENO order is confirmed'

  // Email clients can't resolve relative URLs, so logos need an absolute origin
  // (production domain as fallback, not localhost). See lib/email/brand.ts.
  const baseUrl = emailBaseUrl()

  // The "100% donated" promise only holds for the Life4HSP collaboration
  // product, not for the whole shop. Detect it by name (same convention as the
  // storefront, app/shop/[slug]/page.tsx) and only then show the donation note.
  const isCharityOrder = data.items.some((i) => /life4hsp/i.test(i.name))

  const itemsHtml = data.items.map((i) => itemRowHtml(i, currency)).join('')

  const totalsHtml = [
    totalRowHtml('Subtotal', formatMoney(data.subtotalCents, currency)),
    data.discountCents > 0 ? totalRowHtml('Discount', `-${formatMoney(data.discountCents, currency)}`) : '',
    totalRowHtml('Shipping', data.shippingCents === 0 ? 'Free' : formatMoney(data.shippingCents, currency)),
    totalRowHtml('Total', formatMoney(data.totalCents, currency), { strong: true }),
  ].join('')

  const addr = data.shippingAddress
  const addressHtml = [addr.name, addr.line1, `${addr.postalCode} ${addr.city}`, addr.country]
    .filter(Boolean)
    .map((line) => escapeHtml(line))
    .join('<br />')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light only" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:${BONE};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BONE};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:${SURFACE};border:1px solid ${RULE};">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:40px 40px 8px;">
              <img src="${baseUrl}${EMAIL_WORDMARK.src}" width="${EMAIL_WORDMARK.width}" height="${EMAIL_WORDMARK.height}" alt="7ENO" style="display:block;border:0;margin:0 auto;max-width:100%;" />
              <div style="font-family:${MONO};font-size:10px;letter-spacing:4px;text-transform:uppercase;color:${ACCENT_INK};margin-top:12px;">Order Confirmation</div>
            </td>
          </tr>
          <!-- Greeting -->
          <tr>
            <td style="padding:24px 40px 0;">
              <h1 style="margin:0 0 12px;font-family:${DISPLAY};font-weight:900;font-size:24px;line-height:1.1;text-transform:uppercase;color:${INK};">Thank you, ${escapeHtml(firstName(data.customerName))}.</h1>
              <p style="margin:0;font-family:${BODY};font-size:16px;line-height:1.6;color:${INK};">
                Your order is confirmed and being prepared. Reference
                <span style="font-family:${MONO};font-size:13px;color:${ACCENT_INK};">${escapeHtml(data.orderRef)}</span>.
              </p>
            </td>
          </tr>
          <!-- Items -->
          <tr>
            <td style="padding:24px 40px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${itemsHtml}
              </table>
            </td>
          </tr>
          <!-- Totals -->
          <tr>
            <td style="padding:16px 40px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${totalsHtml}
              </table>
            </td>
          </tr>
          <!-- Pre-sale note -->
          <tr>
            <td style="padding:24px 40px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BONE};border-left:3px solid ${ACCENT};">
                <tr>
                  <td style="padding:14px 16px;font-family:${MONO};font-size:12px;line-height:1.7;color:${INK};">
                    <strong style="color:${ACCENT_INK};text-transform:uppercase;letter-spacing:1px;">Pre-sale order</strong><br />
                    Because these pieces are pre-sale, shipping can run up to 5 working days longer than the usual estimate. Your order is reserved and ships the moment stock lands.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Shipping address -->
          <tr>
            <td style="padding:24px 40px 0;">
              <div style="font-family:${MONO};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${MUTED};margin-bottom:8px;">Shipping to</div>
              <p style="margin:0;font-family:${BODY};font-size:15px;line-height:1.6;color:${INK};">${addressHtml}</p>
            </td>
          </tr>
          <!-- Donation (charity collaboration product only) -->
          ${isCharityOrder ? `<tr>
            <td align="center" style="padding:28px 40px 0;">
              <img src="${baseUrl}/brand/life4hsp.png" width="96" height="68" alt="Life4HSP" style="display:block;border:0;margin:0 auto 12px;max-width:100%;" />
              <p style="margin:0;font-family:${BODY};font-size:15px;line-height:1.6;color:${ACCENT_INK};text-align:center;">Wear it for good. 100% of this product is donated to <a href="https://life4hsp.com/" target="_blank" rel="noopener noreferrer" style="color:${ACCENT_INK};text-decoration:underline;">Life4HSP</a>.</p>
            </td>
          </tr>` : ''}
          <!-- Footer -->
          <tr>
            <td align="center" style="padding:28px 40px 40px;">
              <hr style="border:none;border-top:1px solid ${RULE};margin:0 0 20px;" />
              <img src="${baseUrl}${EMAIL_MARK.src}" width="${EMAIL_MARK.width}" height="${EMAIL_MARK.height}" alt="" style="display:block;border:0;margin:0 auto 12px;" />
              <p style="margin:0;font-family:${MONO};font-size:11px;line-height:1.7;color:${MUTED};text-align:center;">
                7ENO · Numbered editions by Abra Entertainment<br />
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
    '7ENO · ORDER CONFIRMATION',
    '',
    `Thank you, ${firstName(data.customerName)}.`,
    `Your order is confirmed and being prepared. Reference ${data.orderRef}.`,
    '',
    'ITEMS',
    ...data.items.map(
      (i) => `- ${i.name}${i.variant ? ` (${i.variant})` : ''} ×${i.quantity}  ${formatMoney(i.amountCents, currency)}`
    ),
    '',
    `Subtotal: ${formatMoney(data.subtotalCents, currency)}`,
    ...(data.discountCents > 0 ? [`Discount: -${formatMoney(data.discountCents, currency)}`] : []),
    `Shipping: ${data.shippingCents === 0 ? 'Free' : formatMoney(data.shippingCents, currency)}`,
    `Total: ${formatMoney(data.totalCents, currency)}`,
    '',
    'PRE-SALE ORDER',
    'Because these pieces are pre-sale, shipping can run up to 5 working days longer than the usual estimate. Your order is reserved and ships the moment stock lands.',
    '',
    'SHIPPING TO',
    `${addr.name}`,
    `${addr.line1}`,
    `${addr.postalCode} ${addr.city}`,
    `${addr.country}`,
    '',
    ...(isCharityOrder
      ? ['Wear it for good. 100% of this product is donated to Life4HSP (https://life4hsp.com).', '']
      : []),
    'Questions about your order? Just reply to this email.',
    '7ENO · Numbered editions by Abra Entertainment',
  ].join('\n')

  return { subject, html, text }
}

/**
 * Render and send the order confirmation to the customer, blind-copying the
 * shop inbox (ORDER_EMAIL_BCC) when configured. Best-effort: returns the
 * result instead of throwing, so callers (the Stripe webhook) never fail a
 * paid order over an email hiccup.
 */
export async function sendOrderConfirmationEmail(
  to: string,
  data: OrderEmailData
): Promise<SendEmailResult> {
  const { subject, html, text } = renderOrderConfirmation(data)
  const bcc = process.env.ORDER_EMAIL_BCC || undefined
  return sendEmail({ to, subject, html, text, bcc })
}
