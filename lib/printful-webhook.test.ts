import { verifyPrintfulToken, mapPrintfulStatus, extractShipment } from './printful-webhook'

describe('verifyPrintfulToken', () => {
  test('empty secret accepts (degraded mode)', () => {
    expect(verifyPrintfulToken('anything', '')).toBe(true)
  })
  test('matching token accepts', () => {
    expect(verifyPrintfulToken('s3cret', 's3cret')).toBe(true)
  })
  test('mismatching token rejects', () => {
    expect(verifyPrintfulToken('nope', 's3cret')).toBe(false)
  })
  test('missing token rejects when secret set', () => {
    expect(verifyPrintfulToken(null, 's3cret')).toBe(false)
  })
  test('different length rejects without throwing', () => {
    expect(verifyPrintfulToken('short', 'muchlongersecret')).toBe(false)
  })
})

describe('mapPrintfulStatus', () => {
  test('package_shipped → shipped', () => {
    expect(mapPrintfulStatus('package_shipped')).toBe('shipped')
  })
  test('order_canceled → cancelled', () => {
    expect(mapPrintfulStatus('order_canceled')).toBe('cancelled')
  })
  test('order_failed → failed', () => {
    expect(mapPrintfulStatus('order_failed')).toBe('failed')
  })
  test('order_updated inprocess → in_production', () => {
    expect(mapPrintfulStatus('order_updated', 'inprocess')).toBe('in_production')
  })
  test('order_updated fulfilled → shipped', () => {
    expect(mapPrintfulStatus('order_updated', 'fulfilled')).toBe('shipped')
  })
  test('order_updated pending → pending', () => {
    expect(mapPrintfulStatus('order_updated', 'pending')).toBe('pending')
  })
  test('order_updated onhold → on_hold', () => {
    expect(mapPrintfulStatus('order_updated', 'onhold')).toBe('on_hold')
  })
  test('order_updated partial → partially_shipped', () => {
    expect(mapPrintfulStatus('order_updated', 'partial')).toBe('partially_shipped')
  })
  test('order_updated unknown status defaults to in_production', () => {
    expect(mapPrintfulStatus('order_updated')).toBe('in_production')
  })
})

describe('extractShipment', () => {
  test('reads carrier, number and url', () => {
    const s = extractShipment({
      shipment: { carrier: 'USPS', tracking_number: '9400', tracking_url: 'http://t/9400' },
    })
    expect(s).toMatchObject({ carrier: 'USPS', tracking_number: '9400', tracking_url: 'http://t/9400' })
  })
  test('uses ship_date for shipped_at when present', () => {
    const s = extractShipment({
      shipment: { tracking_number: '1', ship_date: '2026-07-03' },
    })
    expect(s?.shipped_at).toBe('2026-07-03')
  })
  test('null when no shipment', () => {
    expect(extractShipment({})).toBeNull()
  })
  test('null when shipment lacks tracking number', () => {
    expect(extractShipment({ shipment: { carrier: 'USPS' } })).toBeNull()
  })
})
