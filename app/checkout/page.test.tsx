import { act, fireEvent, render, screen } from '@testing-library/react'
import { useCartStore } from '@/store/cart'
import type { CartItem } from '@/types/cart'
import CheckoutPage from './page'

let mockUser: { id: string } | null = null

jest.mock('../../lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: mockUser } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
    },
  }),
}))

const ITEM: CartItem = {
  provider: 'printful', variantId: 'v1', productId: 'p1', productName: 'Olympian Tee Ocean Unisex',
  variantName: 'Olympian Tee Ocean Unisex / M', price: '45.00', currency: 'EUR', quantity: 1, imageUrl: null,
}

const fetchMock = jest.fn()
const reply = (status: number, body: unknown) => ({ ok: status >= 200 && status < 300, status, json: async () => body })
const row = (label: string) => screen.getByText(label).parentElement as HTMLElement

// Renders and flushes the auth lookup (getUser resolves on a microtask), so
// the guest notice state settles inside act and the output stays clean.
async function renderPage() {
  await act(async () => {
    render(<CheckoutPage />)
  })
}

function fillAddress() {
  fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Sam Test' } })
  fireEvent.change(screen.getByLabelText('Address'), { target: { value: 'Teststraat 1' } })
  fireEvent.change(screen.getByLabelText('Postal code'), { target: { value: '3011 AA' } })
  fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Rotterdam' } })
}

beforeEach(() => {
  mockUser = null
  fetchMock.mockReset()
  global.fetch = fetchMock as unknown as typeof fetch
  useCartStore.setState({ items: [ITEM], isCartOpen: false })
})

describe('checkout page (characterisation)', () => {
  it('shows an empty cart with a way back to the shop', async () => {
    useCartStore.setState({ items: [] })
    await renderPage()
    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to Shop' })).toHaveAttribute('href', '/shop')
  })

  it('asks for the shipping address with the Netherlands preselected', async () => {
    await renderPage()
    for (const label of ['Full name', 'Address', 'Address line 2 (optional)', 'Postal code', 'City']) {
      expect(screen.getByLabelText(label)).toHaveValue('')
    }
    const country = screen.getByLabelText('Country')
    expect(country).toHaveValue('NL')
    expect(Array.from((country as HTMLSelectElement).options).map((o) => o.value)).toEqual(['NL', 'BE', 'DE', 'FR', 'GB'])
  })

  it('only enables payment with a full address and the terms accepted', async () => {
    await renderPage()
    const pay = screen.getByRole('button', { name: 'Pay with Stripe' })
    expect(pay).toBeDisabled()
    expect(screen.getByText('Fill in your shipping address to continue.')).toBeInTheDocument()
    fillAddress()
    expect(pay).toBeDisabled()
    expect(screen.getByText('Please accept the Terms & Conditions and Returns Policy to continue.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('checkbox'))
    expect(pay).toBeEnabled()
  })

  it('shows subtotal, flat shipping and total', async () => {
    await renderPage()
    expect(row('Subtotal')).toHaveTextContent('€45.00')
    expect(row('Shipping')).toHaveTextContent('€4.95')
    expect(row('Total')).toHaveTextContent('€49.95')
    expect(screen.getByText('Flat €4.95 shipping. Add €30.00 more for free shipping.')).toBeInTheDocument()
  })

  it('applies a discount code through the promo endpoint and can remove it', async () => {
    fetchMock.mockResolvedValueOnce(reply(200, { valid: true, code: 'WELCOME10', percentOff: 10, freeShipping: false }))
    await renderPage()
    fireEvent.change(screen.getByLabelText('Discount code'), { target: { value: 'welcome10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(await screen.findByText('Code WELCOME10 applied: 10% off.')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/promo/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'welcome10' }),
    })
    expect(row('Discount (WELCOME10)')).toHaveTextContent('-€4.50')
    expect(row('Total')).toHaveTextContent('€45.45')
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(screen.queryByText('Discount (WELCOME10)')).toBeNull()
  })

  it('offers a log-in link when a code needs an account', async () => {
    mockUser = { id: 'u1' }
    fetchMock.mockResolvedValueOnce(reply(401, { valid: false, error: 'Log in to use a discount code.' }))
    await renderPage()
    fireEvent.change(screen.getByLabelText('Discount code'), { target: { value: 'MEMBERS' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(await screen.findByText(/Log in to use a discount code\./)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/account/login?redirect=/checkout')
  })

  it('posts the cart and the address to the checkout API and shows its error', async () => {
    fetchMock.mockResolvedValueOnce(reply(409, { error: 'One or more products are not available' }))
    await renderPage()
    fillAddress()
    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'BE' } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Pay with Stripe' }))
    expect(await screen.findByText('One or more products are not available')).toBeInTheDocument()
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/checkout')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({
      items: [ITEM],
      address: { name: 'Sam Test', line1: 'Teststraat 1', line2: '', city: 'Rotterdam', postalCode: '3011 AA', country: 'BE' },
    })
  })

  it('nudges a guest to log in or register', async () => {
    await renderPage()
    expect(await screen.findByText(/Checking out as a guest/)).toBeInTheDocument()
  })
})

describe('checkout shell', () => {
  it('has the form and a labelled order summary', async () => {
    await renderPage()
    expect(screen.getByRole('heading', { level: 1, name: 'Checkout' })).toBeInTheDocument()
    const summary = screen.getByRole('complementary', { name: 'Order summary' })
    expect(summary).toHaveTextContent('Olympian Tee Ocean Unisex')
  })

  it('folds the summary away on mobile behind a toggle with the total', async () => {
    await renderPage()
    const toggle = screen.getByRole('button', { name: /Show order summary/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveTextContent('€49.95')
    fireEvent.click(toggle)
    expect(screen.getByRole('button', { name: /Hide order summary/ })).toHaveAttribute('aria-expanded', 'true')
  })
})
