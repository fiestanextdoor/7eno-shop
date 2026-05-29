import { buildPrintfulHeaders, isAutoConfirmEnabled } from './printful'

describe('buildPrintfulHeaders', () => {
  it('returns Authorization header with Bearer token', () => {
    const headers = buildPrintfulHeaders('test-key-123')
    expect(headers['Authorization']).toBe('Bearer test-key-123')
    expect(headers['Content-Type']).toBe('application/json')
  })
})

describe('isAutoConfirmEnabled', () => {
  const original = process.env.PRINTFUL_AUTO_CONFIRM

  afterEach(() => {
    if (original === undefined) delete process.env.PRINTFUL_AUTO_CONFIRM
    else process.env.PRINTFUL_AUTO_CONFIRM = original
  })

  it('is true only for the exact string "true"', () => {
    process.env.PRINTFUL_AUTO_CONFIRM = 'true'
    expect(isAutoConfirmEnabled()).toBe(true)
  })

  it('is false when unset', () => {
    delete process.env.PRINTFUL_AUTO_CONFIRM
    expect(isAutoConfirmEnabled()).toBe(false)
  })

  it('is false for non-exact values (1, TRUE, yes)', () => {
    for (const v of ['1', 'TRUE', 'yes', 'false', '']) {
      process.env.PRINTFUL_AUTO_CONFIRM = v
      expect(isAutoConfirmEnabled()).toBe(false)
    }
  })
})
