import { statusMeta, deriveOrderStatus, STEP_LABELS } from './order-status'
import type { Fulfillment } from './supabase/types'

const ff = (status: string, provider = 'printful'): Fulfillment => ({
  provider,
  order_id: '1',
  status,
})

describe('statusMeta', () => {
  test('shipped is green at step 2', () => {
    expect(statusMeta('shipped')).toEqual({ label: 'Shipped', tone: 'green', step: 2 })
  })
  test('in_production is default at step 1', () => {
    expect(statusMeta('in_production')).toEqual({ label: 'In production', tone: 'default', step: 1 })
  })
  test('delivered is green at step 3', () => {
    expect(statusMeta('delivered')).toEqual({ label: 'Delivered', tone: 'green', step: 3 })
  })
  test('on_hold is amber', () => {
    expect(statusMeta('on_hold').tone).toBe('amber')
  })
  test('unknown status echoes the raw value', () => {
    expect(statusMeta('weird')).toEqual({ label: 'weird', tone: 'default', step: 0 })
  })
})

describe('deriveOrderStatus', () => {
  test('empty fulfillments falls back to top-level status', () => {
    expect(deriveOrderStatus([], 'processing').label).toBe('Processing')
  })
  test('picks the least-advanced fulfillment (multi-provider)', () => {
    const r = deriveOrderStatus([ff('shipped'), ff('in_production', 'printify')], 'processing')
    expect(r.label).toBe('In production')
  })
  test('all shipped → shipped', () => {
    expect(deriveOrderStatus([ff('shipped'), ff('shipped', 'printify')], 'processing').label).toBe('Shipped')
  })
  test('any failed → needs attention (red)', () => {
    expect(deriveOrderStatus([ff('failed'), ff('shipped', 'printify')], 'processing').tone).toBe('red')
  })
  test('top-level fulfillment_failed → needs attention', () => {
    expect(deriveOrderStatus([ff('processing')], 'fulfillment_failed').tone).toBe('red')
  })
  test('all cancelled → cancelled', () => {
    expect(deriveOrderStatus([ff('cancelled')], 'processing').label).toBe('Cancelled')
  })
  test('cancelled + active → ignores cancelled part', () => {
    expect(deriveOrderStatus([ff('cancelled'), ff('shipped', 'printify')], 'processing').label).toBe('Shipped')
  })
})

test('STEP_LABELS has the four progression steps', () => {
  expect(STEP_LABELS).toEqual(['Ordered', 'In production', 'Shipped', 'Delivered'])
})
