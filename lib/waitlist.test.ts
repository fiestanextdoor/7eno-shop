import { HONEYPOT_FIELD, clientIp, createRateLimiter, parseWaitlistBody } from './waitlist'

describe('parseWaitlistBody', () => {
  it('accepts an email with a known drop and normalises the address', () => {
    expect(parseWaitlistBody({ email: '  Joep@Example.NL ', dropId: 'olympn-sport' })).toEqual({
      ok: true,
      signup: { email: 'joep@example.nl', dropId: 'olympn-sport', productSlug: null },
    })
  })

  it('accepts a product slug and no drop', () => {
    expect(parseWaitlistBody({ email: 'a@b.nl', productSlug: 'olympn-sport-oversized-hoodie-mocha' })).toEqual({
      ok: true,
      signup: { email: 'a@b.nl', dropId: null, productSlug: 'olympn-sport-oversized-hoodie-mocha' },
    })
  })

  it.each([
    [{}, 'Enter a valid email address.'],
    [{ email: 'not-an-email' }, 'Enter a valid email address.'],
    [{ email: 'a@b' }, 'Enter a valid email address.'],
    [{ email: `${'a'.repeat(250)}@b.nl` }, 'Enter a valid email address.'],
    [{ email: 'a@b.nl', dropId: 'og' }, 'Unknown drop.'],
    [{ email: 'a@b.nl', productSlug: '../etc/passwd' }, 'Unknown product.'],
  ])('rejects %j', (body, error) => {
    expect(parseWaitlistBody(body)).toEqual({ ok: false, reason: 'invalid', error })
  })

  it('rejects something that is not an object', () => {
    expect(parseWaitlistBody('a@b.nl')).toEqual({ ok: false, reason: 'invalid', error: 'Invalid request' })
    expect(parseWaitlistBody(null)).toEqual({ ok: false, reason: 'invalid', error: 'Invalid request' })
  })

  it('flags a filled honeypot before anything else', () => {
    expect(parseWaitlistBody({ email: 'bot@spam.io', [HONEYPOT_FIELD]: 'ACME Ltd' })).toEqual({ ok: false, reason: 'honeypot' })
    expect(parseWaitlistBody({ email: 'a@b.nl', [HONEYPOT_FIELD]: '' }).ok).toBe(true)
  })
})

describe('createRateLimiter', () => {
  it('allows `limit` hits per window per key', () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 })
    expect(limiter.check('1.1.1.1', 0)).toBe(true)
    expect(limiter.check('1.1.1.1', 10)).toBe(true)
    expect(limiter.check('1.1.1.1', 20)).toBe(false)
    expect(limiter.check('2.2.2.2', 20)).toBe(true)
    expect(limiter.check('1.1.1.1', 1001)).toBe(true)
  })
})

describe('clientIp', () => {
  it('takes the first forwarded address', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }))).toBe('203.0.113.7')
    expect(clientIp(new Headers({ 'x-real-ip': '198.51.100.2' }))).toBe('198.51.100.2')
    expect(clientIp(new Headers())).toBe('unknown')
  })
})
