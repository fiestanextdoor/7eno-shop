import { renderHook, act } from '@testing-library/react'
import { useCheckout, EMPTY_FORM } from './useCheckout'
import type { CartItem } from '@/types/cart'

const items: CartItem[] = [
  {
    provider: 'printful', variantId: 'v1', productId: 'p1', productName: 'Olympian Tee',
    variantName: 'M', price: '45.00', currency: 'EUR', quantity: 1, imageUrl: null,
  },
]

const fetchMock = jest.fn()
const redirect = jest.fn()

function respond(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

function setup() {
  return renderHook(() => useCheckout(items, { redirect }))
}

function fillAddress(result: ReturnType<typeof setup>['result']) {
  act(() => {
    result.current.updateField('name', 'Test Klant')
    result.current.updateField('line1', 'Coolsingel 1')
    result.current.updateField('postalCode', '3011AA')
    result.current.updateField('city', 'Rotterdam')
  })
}

beforeEach(() => {
  fetchMock.mockReset()
  redirect.mockReset()
  global.fetch = fetchMock as unknown as typeof fetch
})

describe('useCheckout address and consent', () => {
  it('starts empty and cannot pay', () => {
    const { result } = setup()
    expect(result.current.form).toEqual(EMPTY_FORM)
    expect(result.current.form.country).toBe('NL')
    expect(result.current.addressComplete).toBe(false)
    expect(result.current.canPay).toBe(false)
  })

  it('needs name, address, postal code and city, ignoring whitespace-only values', () => {
    const { result } = setup()
    fillAddress(result)
    expect(result.current.addressComplete).toBe(true)
    act(() => result.current.updateField('city', '   '))
    expect(result.current.addressComplete).toBe(false)
  })

  it('can pay only with a complete address and accepted terms', () => {
    const { result } = setup()
    fillAddress(result)
    expect(result.current.canPay).toBe(false)
    act(() => result.current.changeAgreed(true))
    expect(result.current.canPay).toBe(true)
  })
})

describe('useCheckout payment', () => {
  it('does nothing when it cannot pay', async () => {
    const { result } = setup()
    await act(async () => { await result.current.pay() })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('posts items and address and redirects to Stripe', async () => {
    fetchMock.mockResolvedValue(respond(200, { url: 'https://checkout.stripe.test/s/1' }))
    const { result } = setup()
    fillAddress(result)
    act(() => result.current.changeAgreed(true))
    await act(async () => { await result.current.pay() })
    expect(fetchMock).toHaveBeenCalledWith('/api/checkout', expect.objectContaining({ method: 'POST' }))
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body).toEqual({ items, address: { ...EMPTY_FORM, name: 'Test Klant', line1: 'Coolsingel 1', postalCode: '3011AA', city: 'Rotterdam' } })
    expect(redirect).toHaveBeenCalledWith('https://checkout.stripe.test/s/1')
    expect(result.current.payLoading).toBe(false)
  })

  it('shows the server error, for example the 409 for a product outside a live drop', async () => {
    fetchMock.mockResolvedValue(respond(409, { error: 'One or more products are not available' }))
    const { result } = setup()
    fillAddress(result)
    act(() => result.current.changeAgreed(true))
    await act(async () => { await result.current.pay() })
    expect(result.current.payError).toBe('One or more products are not available')
    expect(redirect).not.toHaveBeenCalled()
  })

  it('falls back to a generic message without an error field', async () => {
    fetchMock.mockResolvedValue(respond(500, {}))
    const { result } = setup()
    fillAddress(result)
    act(() => result.current.changeAgreed(true))
    await act(async () => { await result.current.pay() })
    expect(result.current.payError).toBe('Could not start checkout. Please try again.')
  })

  it('reports a network error and clears it when the form changes', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    const { result } = setup()
    fillAddress(result)
    act(() => result.current.changeAgreed(true))
    await act(async () => { await result.current.pay() })
    expect(result.current.payError).toBe('Network error. Please try again.')
    expect(result.current.payLoading).toBe(false)
    act(() => result.current.updateField('line2', 'Bus 2'))
    expect(result.current.payError).toBeNull()
  })
})

describe('useCheckout discount code', () => {
  it('ignores a blank code', async () => {
    const { result } = setup()
    act(() => result.current.changePromoInput('   '))
    await act(async () => { await result.current.applyPromo() })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('applies a valid code and sends it with the payment', async () => {
    fetchMock.mockResolvedValueOnce(respond(200, { valid: true, code: '7ENO-ZGSEA', percentOff: 15, freeShipping: true }))
    const { result } = setup()
    act(() => result.current.changePromoInput(' 7eno-zgsea '))
    await act(async () => { await result.current.applyPromo() })
    expect(fetchMock).toHaveBeenCalledWith('/api/promo/validate', expect.objectContaining({ body: JSON.stringify({ code: '7eno-zgsea' }) }))
    expect(result.current.promo).toEqual({ code: '7ENO-ZGSEA', percentOff: 15, freeShipping: true })
    expect(result.current.promoMsg).toEqual({ type: 'success', text: 'Code 7ENO-ZGSEA applied: 15% off and free shipping.' })

    fetchMock.mockResolvedValueOnce(respond(200, { url: 'https://checkout.stripe.test/s/2' }))
    fillAddress(result)
    act(() => result.current.changeAgreed(true))
    await act(async () => { await result.current.pay() })
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).promoCode).toBe('7ENO-ZGSEA')
  })

  it('asks a guest to log in on 401', async () => {
    fetchMock.mockResolvedValue(respond(401, { error: 'Create an account or log in to use this discount code.' }))
    const { result } = setup()
    act(() => result.current.changePromoInput('MAARDANWEL'))
    await act(async () => { await result.current.applyPromo() })
    expect(result.current.promo).toBeNull()
    expect(result.current.promoNeedsLogin).toBe(true)
    expect(result.current.promoMsg).toEqual({ type: 'error', text: 'Create an account or log in to use this discount code.' })
  })

  it('keeps an applied code on a network error', async () => {
    fetchMock.mockResolvedValueOnce(respond(200, { valid: true, code: 'MAARDANWEL', percentOff: 7, freeShipping: false }))
    const { result } = setup()
    act(() => result.current.changePromoInput('MAARDANWEL'))
    await act(async () => { await result.current.applyPromo() })
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await act(async () => { await result.current.applyPromo() })
    expect(result.current.promo?.code).toBe('MAARDANWEL')
    expect(result.current.promoMsg).toEqual({ type: 'error', text: 'Network error. Please try again.' })
    expect(result.current.promoLoading).toBe(false)
  })

  it('removes the code and resets the input and message', async () => {
    fetchMock.mockResolvedValue(respond(200, { valid: true, code: 'MAARDANWEL', percentOff: 7, freeShipping: false }))
    const { result } = setup()
    act(() => result.current.changePromoInput('MAARDANWEL'))
    await act(async () => { await result.current.applyPromo() })
    act(() => result.current.removePromo())
    expect(result.current.promo).toBeNull()
    expect(result.current.promoInput).toBe('')
    expect(result.current.promoMsg).toBeNull()
    expect(result.current.promoNeedsLogin).toBe(false)
  })

  it('clears the message when the code is edited', async () => {
    fetchMock.mockResolvedValue(respond(400, { error: 'This discount code is not valid.' }))
    const { result } = setup()
    act(() => result.current.changePromoInput('NOPE'))
    await act(async () => { await result.current.applyPromo() })
    expect(result.current.promoMsg?.type).toBe('error')
    act(() => result.current.changePromoInput('NOPE2'))
    expect(result.current.promoMsg).toBeNull()
  })
})
