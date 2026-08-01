import { buildPrintfulHeaders, isAutoConfirmEnabled, createOrder } from './printful'

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

describe('createOrder', () => {
  const originalKey = process.env.PRINTFUL_API_KEY
  const originalConfirm = process.env.PRINTFUL_AUTO_CONFIRM
  const originalFetch = global.fetch

  beforeEach(() => {
    process.env.PRINTFUL_API_KEY = 'test-key'
    delete process.env.PRINTFUL_AUTO_CONFIRM
  })

  afterEach(() => {
    if (originalKey === undefined) delete process.env.PRINTFUL_API_KEY
    else process.env.PRINTFUL_API_KEY = originalKey
    if (originalConfirm === undefined) delete process.env.PRINTFUL_AUTO_CONFIRM
    else process.env.PRINTFUL_AUTO_CONFIRM = originalConfirm
    global.fetch = originalFetch
  })

  function mockFetch() {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: { id: 1 } }),
    })
    global.fetch = fetchMock as unknown as typeof fetch
    return fetchMock
  }

  const recipient = {
    name: 'Test', email: 't@example.com', address1: 'Street 1',
    city: 'Zierikzee', state_code: '', country_code: 'NL', zip: '4301 JK',
  }
  const items = [{ sync_variant_id: 1, quantity: 1 }]

  // Printful weigert een external_id langer dan 32 tekens met
  // "Invalid External ID specified" (400). Een live Stripe-sessie-id is er 66,
  // dus dat veld meesturen brak elke betaalde bestelling. Nooit meer toevoegen:
  // de status-webhook matcht op printful_order_id.
  it('sends no external_id at all', async () => {
    const fetchMock = mockFetch()
    await createOrder(recipient, items)
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body).not.toHaveProperty('external_id')
    expect(body.recipient).toEqual(recipient)
    expect(body.items).toEqual(items)
  })

  it('omits shipping when no method is given, includes it when given', async () => {
    const a = mockFetch()
    await createOrder(recipient, items)
    expect(JSON.parse(a.mock.calls[0][1].body)).not.toHaveProperty('shipping')

    const b = mockFetch()
    await createOrder(recipient, items, 'STANDARD')
    expect(JSON.parse(b.mock.calls[0][1].body).shipping).toBe('STANDARD')
  })

  it('only appends confirm=1 when auto-confirm is enabled', async () => {
    const a = mockFetch()
    await createOrder(recipient, items)
    expect(a.mock.calls[0][0]).toBe('https://api.printful.com/orders')

    process.env.PRINTFUL_AUTO_CONFIRM = 'true'
    const b = mockFetch()
    await createOrder(recipient, items)
    expect(b.mock.calls[0][0]).toBe('https://api.printful.com/orders?confirm=1')
  })
})
