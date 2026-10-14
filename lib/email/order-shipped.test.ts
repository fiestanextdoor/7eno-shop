import { renderOrderShipped, type ShippedEmailData } from './order-shipped'
import { EMAIL_WORDMARK } from './brand'

const data: ShippedEmailData = {
  orderRef: 'PF123456',
  customerName: 'Joep Arend',
  carrier: 'PostNL',
  trackingNumber: '3STOTAL1234567',
  trackingUrl: 'https://postnl.nl/track/3STOTAL1234567',
  shippingAddress: {
    name: 'Joep Arend',
    line1: 'Voorbeeldstraat 1',
    city: 'Utrecht',
    postalCode: '3500 AA',
    country: 'NL',
  },
}

test('subject signals the order is on its way', () => {
  expect(renderOrderShipped(data).subject.toLowerCase()).toContain('on its way')
})

test('html contains the tracking url and number', () => {
  const { html } = renderOrderShipped(data)
  expect(html).toContain('https://postnl.nl/track/3STOTAL1234567')
  expect(html).toContain('3STOTAL1234567')
  expect(html).toContain('PostNL')
})

test('html greets the customer by first name', () => {
  expect(renderOrderShipped(data).html).toContain('Joep')
})

test('text version contains the tracking url', () => {
  expect(renderOrderShipped(data).text).toContain('https://postnl.nl/track/3STOTAL1234567')
})

test('escapes html in customer-provided fields', () => {
  const evil = { ...data, customerName: '<script>x</script>' }
  expect(renderOrderShipped(evil).html).not.toContain('<script>x</script>')
})

test('renders in the official palette with the new wordmark and no v1 leftovers', () => {
  const { html, text } = renderOrderShipped(data)
  expect(html).toContain('#2D3A4F')
  expect(html).toContain(EMAIL_WORDMARK.src)
  expect(html).not.toMatch(/#111111|#5C1A1B|Georgia|\/logos\/|font-style:italic/)
  expect(html + text).not.toContain('Divine Authority')
  expect(html + text).not.toMatch(/[\u2013\u2014]/)
  expect(text.split('\n')[0]).toBe('7ENO · SHIPPED')
})

test('escapes an ampersand in the carrier exactly once', () => {
  const { html } = renderOrderShipped({ ...data, carrier: 'DHL & Co' })
  expect(html).toContain('DHL &amp; Co')
  expect(html).not.toContain('&amp;amp;')
})
