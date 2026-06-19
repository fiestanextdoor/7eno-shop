import { renderOrderConfirmation, type OrderEmailData } from './order-confirmation'

const baseOrder: OrderEmailData = {
  orderRef: 'PF-12345',
  customerName: 'Joep Arend',
  items: [
    { name: '7ENO Sport Tee', variant: 'Black / M', quantity: 2, amountCents: 5000 },
    { name: '7ENO Beach Towel', variant: null, quantity: 1, amountCents: 3000 },
  ],
  subtotalCents: 8000,
  shippingCents: 0,
  discountCents: 0,
  totalCents: 8000,
  currency: 'eur',
  shippingAddress: {
    name: 'Joep Arend',
    line1: 'Voorbeeldstraat 1',
    city: 'Amsterdam',
    postalCode: '1011 AB',
    country: 'NL',
  },
}

describe('renderOrderConfirmation', () => {
  it('produces a subject, html and text', () => {
    const out = renderOrderConfirmation(baseOrder)
    expect(out.subject).toBe('Your 7ENO order is confirmed')
    expect(out.html).toContain('<!DOCTYPE html>')
    expect(out.text.length).toBeGreaterThan(0)
  })

  it('greets the customer by first name only', () => {
    const out = renderOrderConfirmation(baseOrder)
    expect(out.html).toContain('Thank you, Joep.')
    expect(out.text).toContain('Thank you, Joep.')
  })

  it('falls back to a generic greeting when the name is blank', () => {
    const out = renderOrderConfirmation({ ...baseOrder, customerName: '   ' })
    expect(out.html).toContain('Thank you, there.')
  })

  it('lists every item with its variant, quantity and line total', () => {
    const out = renderOrderConfirmation(baseOrder)
    expect(out.html).toContain('7ENO Sport Tee')
    expect(out.html).toContain('Black / M')
    expect(out.html).toContain('×2')
    expect(out.html).toContain('€50.00')
    expect(out.html).toContain('7ENO Beach Towel')
  })

  it('shows Free shipping and the order reference', () => {
    const out = renderOrderConfirmation(baseOrder)
    expect(out.html).toContain('Free')
    expect(out.html).toContain('PF-12345')
    expect(out.html).toContain('€80.00') // total
  })

  it('only renders a discount row when there is a discount', () => {
    const without = renderOrderConfirmation(baseOrder)
    expect(without.html).not.toContain('Discount')

    const withDiscount = renderOrderConfirmation({
      ...baseOrder,
      discountCents: 1000,
      totalCents: 7000,
    })
    expect(withDiscount.html).toContain('Discount')
    expect(withDiscount.html).toContain('-€10.00')
  })

  it('renders the pre-sale shipping note and the donation line', () => {
    const out = renderOrderConfirmation(baseOrder)
    expect(out.html).toContain('Pre-sale order')
    expect(out.html).toContain('up to 5 working days')
    expect(out.html).toContain('Life4HSP')
  })

  it('includes the shipping address', () => {
    const out = renderOrderConfirmation(baseOrder)
    expect(out.html).toContain('Voorbeeldstraat 1')
    expect(out.html).toContain('1011 AB Amsterdam')
  })

  it('escapes HTML in dynamic fields to prevent broken markup', () => {
    const out = renderOrderConfirmation({
      ...baseOrder,
      items: [{ name: 'Tee <script>alert(1)</script>', variant: 'A & B', quantity: 1, amountCents: 1000 }],
    })
    expect(out.html).not.toContain('<script>alert(1)</script>')
    expect(out.html).toContain('&lt;script&gt;')
    expect(out.html).toContain('A &amp; B')
  })

  it('formats unknown currencies with a code suffix', () => {
    const out = renderOrderConfirmation({ ...baseOrder, currency: 'gbp' })
    expect(out.html).toContain('80.00 GBP')
  })
})
