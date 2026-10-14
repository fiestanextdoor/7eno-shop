import { render, screen, act } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import Countdown, { splitRemaining } from './Countdown'

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }))

const TARGET = '2026-11-01T12:00:00+01:00'
const refresh = jest.fn()

function digits(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('.value')).map((el) => el.textContent ?? '')
}

beforeEach(() => {
  jest.useFakeTimers()
  refresh.mockReset()
  jest.mocked(useRouter).mockReturnValue({ refresh } as unknown as ReturnType<typeof useRouter>)
})

afterEach(() => {
  jest.useRealTimers()
})

describe('splitRemaining', () => {
  it('splits milliseconds into days, hours, minutes and seconds', () => {
    expect(splitRemaining(90_061_000)).toEqual({ days: 1, hours: 1, minutes: 1, seconds: 1 })
  })
  it('never goes below zero', () => {
    expect(splitRemaining(-5000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  })
})

describe('Countdown', () => {
  it('always carries the date, time and zone as text', () => {
    jest.setSystemTime(new Date('2026-10-31T11:00:00Z'))
    render(<Countdown target={TARGET} />)
    expect(screen.getByText('1 November 2026 at 12:00 CET')).toHaveAttribute('datetime', TARGET)
  })

  it('prefers the label the server formatted', () => {
    jest.setSystemTime(new Date('2026-10-31T11:00:00Z'))
    render(<Countdown target={TARGET} label="1 November 2026 at 12:00 CET (server)" />)
    expect(screen.getByText('1 November 2026 at 12:00 CET (server)')).toBeInTheDocument()
  })

  it('keeps the ticking digits away from screen readers', () => {
    jest.setSystemTime(new Date('2026-10-31T11:00:00Z'))
    const { container } = render(<Countdown target={TARGET} />)
    const clock = container.querySelector('.clock')
    expect(clock).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('[aria-live]')).toBeNull()
  })

  it('counts down every second', () => {
    jest.setSystemTime(new Date('2026-11-01T10:59:57Z'))
    const { container } = render(<Countdown target={TARGET} />)
    expect(digits(container)).toEqual(['00', '00', '00', '03'])
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    expect(digits(container)).toEqual(['00', '00', '00', '02'])
  })

  it('shows Live now at the release second and refreshes the page exactly once', () => {
    jest.setSystemTime(new Date('2026-11-01T10:59:59Z'))
    render(<Countdown target={TARGET} />)
    expect(screen.queryByText('Live now')).toBeNull()
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    expect(screen.getByText('Live now')).toBeInTheDocument()
    act(() => {
      jest.advanceTimersByTime(5000)
    })
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('keeps refreshing after the release until it unmounts, then stops', () => {
    jest.setSystemTime(new Date('2026-11-01T10:59:59Z'))
    const { unmount } = render(<Countdown target={TARGET} />)
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    act(() => {
      jest.advanceTimersByTime(30_000)
    })
    const calls = refresh.mock.calls.length
    expect(calls).toBeGreaterThan(1)
    unmount()
    act(() => {
      jest.advanceTimersByTime(60_000)
    })
    expect(refresh).toHaveBeenCalledTimes(calls)
    expect(jest.getTimerCount()).toBe(0)
  })

  it('gives up refreshing after 20 attempts', () => {
    jest.setSystemTime(new Date('2026-11-01T11:00:01Z'))
    render(<Countdown target={TARGET} />)
    act(() => {
      jest.advanceTimersByTime(15 * 60_000)
    })
    expect(refresh).toHaveBeenCalledTimes(20)
    expect(jest.getTimerCount()).toBe(0)
  })
})
