import { buildPrintfulHeaders } from './printful'

describe('buildPrintfulHeaders', () => {
  it('returns Authorization header with Bearer token', () => {
    const headers = buildPrintfulHeaders('test-key-123')
    expect(headers['Authorization']).toBe('Bearer test-key-123')
    expect(headers['Content-Type']).toBe('application/json')
  })
})
