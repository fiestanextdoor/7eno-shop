import { renderOrderConfirmation, type OrderEmailData } from './order-confirmation'
import { EMAIL_WORDMARK } from './brand'

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

  it('renders the pre-sale shipping note', () => {
    const out = renderOrderConfirmation(baseOrder)
    expect(out.html).toContain('Pre-sale order')
    expect(out.html).toContain('up to 5 working days')
  })

  it('omits the donation note when no Life4HSP product is ordered', () => {
    const out = renderOrderConfirmation(baseOrder)
    expect(out.html).not.toContain('Life4HSP')
    expect(out.html).not.toContain('donated to')
    expect(out.text).not.toContain('donated to')
  })

  it('shows the donation note only for the Life4HSP collaboration product', () => {
    const out = renderOrderConfirmation({
      ...baseOrder,
      items: [{ name: '7ENO X Life4HSP Sport Tee', variant: 'Black / M', quantity: 1, amountCents: 4000 }],
    })
    expect(out.html).toContain('100% of this product is donated to')
    expect(out.html).toContain('Life4HSP')
    expect(out.text).toContain('100% of this product is donated to Life4HSP')
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

describe('v2 brand', () => {
  it('renders in the official palette with the new wordmark', () => {
    const { html } = renderOrderConfirmation(baseOrder)
    for (const hex of ['#2D3A4F', '#F7F1DA', '#FFFFFF', '#C4C4B5']) expect(html).toContain(hex)
    expect(html).toContain(`${EMAIL_WORDMARK.src}" width="120" height="${EMAIL_WORDMARK.height}"`)
    expect(html).not.toMatch(/#111111|#5C1A1B|#F6F3EC|#EDE8DD|#8A8275|Georgia|\/logos\//)
  })

  it('sets the heading in Arial Black and drops the italics', () => {
    const { html } = renderOrderConfirmation(baseOrder)
    expect(html).toContain("font-family:'Arial Black', Arial, sans-serif;font-weight:900")
    expect(html).not.toContain('font-style:italic')
  })

  it('never uses periwinkle as a text colour', () => {
    const { html } = renderOrderConfirmation(baseOrder)
    expect(html).toContain('#3E5A8F')
    expect(html).not.toMatch(/color:#7995C7/i)
  })

  it('drops the v1 tagline and the long dashes', () => {
    const out = renderOrderConfirmation(baseOrder)
    expect(out.html + out.text).not.toContain('Divine Authority')
    expect(out.html + out.text).not.toMatch(/[\u2013\u2014]/)
    expect(out.text.split('\n')[0]).toBe('7ENO · ORDER CONFIRMATION')
  })

  it('escapes an ampersand product name exactly once and keeps the text version plain', () => {
    const out = renderOrderConfirmation({
      ...baseOrder,
      items: [{ name: 'Tee & Towel "Set"', variant: 'Rose Red / L', quantity: 1, amountCents: 4500 }],
    })
    expect(out.html).toContain('Tee &amp; Towel &quot;Set&quot;')
    expect(out.html).not.toContain('&amp;amp;')
    expect(out.text).toContain('Tee & Towel "Set"')
  })
})
