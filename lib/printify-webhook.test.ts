import crypto from 'crypto'
import { verifyPrintifySignature, mapPrintifyStatus, buildPublishHandle } from './printify-webhook'

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

describe('buildPublishHandle', () => {
  it('builds the public product URL from base url and slug', () => {
    expect(buildPublishHandle('stroke-tee', 'https://www.7eno.shop')).toBe(
      'https://www.7eno.shop/shop/stroke-tee'
    )
  })
  it('strips a trailing slash from the base url', () => {
    expect(buildPublishHandle('stroke-tee', 'https://www.7eno.shop/')).toBe(
      'https://www.7eno.shop/shop/stroke-tee'
    )
  })
  it('returns empty string when base url or slug is missing', () => {
    expect(buildPublishHandle('stroke-tee', undefined)).toBe('')
    expect(buildPublishHandle('', 'https://www.7eno.shop')).toBe('')
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
