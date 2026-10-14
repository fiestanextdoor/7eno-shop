import { render, screen, fireEvent, act } from '@testing-library/react'
import WaitlistForm from './WaitlistForm'

const mockFetch = jest.fn()

function okResponse() {
  return { ok: true, json: async () => ({ ok: true }) }
}

beforeEach(() => {
  mockFetch.mockReset()
  global.fetch = mockFetch as unknown as typeof fetch
})

function fillAndSubmit(value = 'a@b.nl') {
  const input = screen.getByLabelText('Get notified when it drops')
  fireEvent.change(input, { target: { value } })
  const form = input.closest('form') as HTMLFormElement
  fireEvent.submit(form)
  return form
}

describe('WaitlistForm', () => {
  it('posts the address with the drop and confirms', async () => {
    mockFetch.mockResolvedValue(okResponse())
    render(<WaitlistForm dropId="olympn-sport" />)
    fillAndSubmit()
    expect(await screen.findByText("You're on the list. We'll email you when it drops.")).toBeInTheDocument()
    expect(mockFetch).toHaveBeenCalledWith('/api/waitlist', expect.objectContaining({ method: 'POST' }))
    expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual({ email: 'a@b.nl', dropId: 'olympn-sport', company: '' })
    expect(screen.getByLabelText('Get notified when it drops')).toBeDisabled()
  })

  it('sends one request when submitted twice while the first is in flight', async () => {
    let resolve: (value: unknown) => void = () => {}
    mockFetch.mockReturnValue(new Promise((r) => { resolve = r }))
    render(<WaitlistForm dropId="olympn-sport" />)
    const form = fillAndSubmit()
    fireEvent.submit(form)
    fireEvent.click(screen.getByRole('button', { name: 'Notify me' }))
    expect(mockFetch).toHaveBeenCalledTimes(1)
    await act(async () => {
      resolve(okResponse())
    })
    expect(await screen.findByText(/on the list/)).toBeInTheDocument()
  })

  it('shows the server message on a rejected address', async () => {
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({ error: 'Enter a valid email address.' }) })
    render(<WaitlistForm />)
    fillAndSubmit('nope')
    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument()
    expect(screen.getByLabelText('Get notified when it drops')).not.toBeDisabled()
  })

  it('survives a network error', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))
    render(<WaitlistForm />)
    fillAndSubmit()
    expect(await screen.findByText('Network error. Please try again.')).toBeInTheDocument()
  })

  it('announces the outcome politely', () => {
    render(<WaitlistForm />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
  })

  it('uses a short label in compact mode', () => {
    render(<WaitlistForm compact />)
    expect(screen.getByLabelText('Email for drop alerts')).toBeInTheDocument()
  })
})
