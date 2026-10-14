/** @jest-environment node */
import { NextRequest } from 'next/server'
import { POST } from './route'

const mockAdd = jest.fn()
jest.mock('../../../lib/waitlist-resend', () => ({
  addWaitlistContact: (...args: unknown[]) => mockAdd(...args),
}))

// The limiter lives in the module, so every test uses its own address.
function request(body: unknown, ip: string) {
  return new NextRequest('http://localhost/api/waitlist', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

beforeEach(() => {
  mockAdd.mockReset().mockResolvedValue('added')
})

describe('POST /api/waitlist', () => {
  it('adds a valid signup', async () => {
    const res = await POST(request({ email: 'A@B.nl', dropId: 'olympn-sport', hp_note: '' }, '10.0.0.1'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(mockAdd).toHaveBeenCalledWith({ email: 'a@b.nl', dropId: 'olympn-sport', productSlug: null })
  })

  it('answers a bot that filled the honeypot like a person, without storing it', async () => {
    const res = await POST(request({ email: 'bot@spam.io', hp_note: 'ACME' }, '10.0.0.2'))
    expect(res.status).toBe(200)
    expect(mockAdd).not.toHaveBeenCalled()
  })

  it('rejects an invalid address and broken JSON with 400', async () => {
    expect((await POST(request({ email: 'nope' }, '10.0.0.3'))).status).toBe(400)
    expect((await POST(request('{not json', '10.0.0.3'))).status).toBe(400)
    expect(mockAdd).not.toHaveBeenCalled()
  })

  it('maps Resend outcomes to 503 and 502', async () => {
    mockAdd.mockResolvedValueOnce('unconfigured')
    expect((await POST(request({ email: 'a@b.nl' }, '10.0.0.4'))).status).toBe(503)
    mockAdd.mockResolvedValueOnce('failed')
    expect((await POST(request({ email: 'a@b.nl' }, '10.0.0.4'))).status).toBe(502)
  })

  it('limits one address to five attempts per window, not its neighbours', async () => {
    for (let i = 0; i < 5; i++) {
      expect((await POST(request({ email: `a${i}@b.nl` }, '10.0.0.5'))).status).toBe(200)
    }
    expect((await POST(request({ email: 'a5@b.nl' }, '10.0.0.5'))).status).toBe(429)
    expect((await POST(request({ email: 'a6@b.nl' }, '10.0.0.6'))).status).toBe(200)
  })
})
