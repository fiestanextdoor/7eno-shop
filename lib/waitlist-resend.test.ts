/** @jest-environment node */
import { addWaitlistContact } from './waitlist-resend'

const mockCreate = jest.fn()
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ contacts: { create: (...args: unknown[]) => mockCreate(...args) } })),
}))

const ORIGINAL_ENV = { ...process.env }
const SIGNUP = { email: 'a@b.nl', dropId: 'olympn-sport', productSlug: null }

beforeEach(() => {
  mockCreate.mockReset().mockResolvedValue({ data: { id: 'c_1', object: 'contact' }, error: null })
  process.env = { ...ORIGINAL_ENV, RESEND_API_KEY: 're_test', RESEND_WAITLIST_AUDIENCE_ID: 'aud_test' }
})

afterAll(() => {
  process.env = ORIGINAL_ENV
})

describe('addWaitlistContact', () => {
  it('adds the contact to the waitlist audience with the drop as a property', async () => {
    await expect(addWaitlistContact(SIGNUP)).resolves.toBe('added')
    expect(mockCreate).toHaveBeenCalledWith({
      audienceId: 'aud_test',
      email: 'a@b.nl',
      unsubscribed: false,
      properties: { drop_id: 'olympn-sport' },
    })
  })

  it('sends no properties when there are none', async () => {
    await addWaitlistContact({ email: 'a@b.nl', dropId: null, productSlug: null })
    expect(mockCreate).toHaveBeenCalledWith({ audienceId: 'aud_test', email: 'a@b.nl', unsubscribed: false })
  })

  it('treats an address that is already on the list as added', async () => {
    mockCreate.mockResolvedValue({ data: null, error: { name: 'validation_error', message: 'Contact already exists', statusCode: 409 } })
    await expect(addWaitlistContact(SIGNUP)).resolves.toBe('added')
  })

  it('reports other Resend errors and network failures as failed', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockCreate.mockResolvedValueOnce({ data: null, error: { name: 'rate_limit_exceeded', message: 'Too many requests', statusCode: 429 } })
    await expect(addWaitlistContact(SIGNUP)).resolves.toBe('failed')
    mockCreate.mockRejectedValueOnce(new Error('socket hang up'))
    await expect(addWaitlistContact(SIGNUP)).resolves.toBe('failed')
    errorSpy.mockRestore()
  })

  it('does nothing without a key or audience', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    delete process.env.RESEND_WAITLIST_AUDIENCE_ID
    await expect(addWaitlistContact(SIGNUP)).resolves.toBe('unconfigured')
    expect(mockCreate).not.toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('retries without properties when Resend does not know them, and warns once without the address', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    mockCreate.mockResolvedValueOnce({
      data: null,
      error: { name: 'validation_error', message: 'Property drop_id does not exist for a@b.nl', statusCode: 422 },
    })
    await expect(addWaitlistContact(SIGNUP)).resolves.toBe('added')
    expect(mockCreate).toHaveBeenCalledTimes(2)
    expect(mockCreate).toHaveBeenLastCalledWith({ audienceId: 'aud_test', email: 'a@b.nl', unsubscribed: false })
    expect(warnSpy).toHaveBeenCalledTimes(1)
    const logged = warnSpy.mock.calls[0].join(' ')
    expect(logged).toMatch(/drop_id/)
    expect(logged).toMatch(/product_slug/)
    expect(logged).not.toMatch(/a@b\.nl/)
    warnSpy.mockRestore()
  })
})
