import { renderOrderShipped, type ShippedEmailData } from './order-shipped'

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
