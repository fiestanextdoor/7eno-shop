import crypto from 'crypto'

/**
 * Verify a Printify webhook body against the HMAC-SHA256 signature header using
 * the shared secret. Printify sends the signature as `sha256=<hex>`, so the
 * prefix is stripped before comparison. When no secret is configured we accept
 * the request (degraded mode) so status updates still flow before the secret is
 * wired up.
 */
export function verifyPrintifySignature(body: string, signature: string | null, secret: string): boolean {
  if (!secret) return true
  if (!signature) return false
  const received = signature.startsWith('sha256=') ? signature.slice('sha256='.length) : signature
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(received)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

/** Map a Printify webhook topic to our internal fulfillment status string. */
export function mapPrintifyStatus(topic: string): string {
  switch (topic) {
    case 'order:shipment:delivered': return 'delivered'
    case 'order:shipment:created': return 'shipped'
    case 'order:sent-to-production': return 'in_production'
    case 'order:created': return 'pending'
    default: return 'processing'
  }
}
