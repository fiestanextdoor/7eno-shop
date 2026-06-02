import crypto from 'crypto'
import { verifyPrintifySignature, mapPrintifyStatus } from './printify-webhook'

describe('verifyPrintifySignature', () => {
  const secret = 's3cr3t'
  const body = '{"type":"order:updated"}'
  const sig = crypto.createHmac('sha256', secret).update(body).digest('hex')

  it('accepts a correct HMAC-SHA256 signature', () => {
    expect(verifyPrintifySignature(body, sig, secret)).toBe(true)
  })
  it('accepts a signature with the Printify "sha256=" prefix', () => {
    expect(verifyPrintifySignature(body, `sha256=${sig}`, secret)).toBe(true)
  })
  it('rejects a wrong signature', () => {
    expect(verifyPrintifySignature(body, 'deadbeef', secret)).toBe(false)
  })
  it('accepts (degraded) when no secret is configured', () => {
    expect(verifyPrintifySignature(body, sig, '')).toBe(true)
  })
})

describe('mapPrintifyStatus', () => {
  it('maps Printify order topics to internal status', () => {
    expect(mapPrintifyStatus('order:shipment:delivered')).toBe('delivered')
    expect(mapPrintifyStatus('order:shipment:created')).toBe('shipped')
    expect(mapPrintifyStatus('order:sent-to-production')).toBe('in_production')
    expect(mapPrintifyStatus('order:updated')).toBe('processing')
  })
})
