import { render, screen } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import DropBlock from './DropBlock'
import { getDrop, toDropView, type Drop } from '@/lib/drops'

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }))

const sport = getDrop('olympn-sport') as Drop
const olympian = getDrop('olympian') as Drop
const BEFORE = Date.parse('2026-10-14T10:00:00Z')
const AFTER = Date.parse('2026-11-02T10:00:00Z')

beforeEach(() => {
  jest.mocked(useRouter).mockReturnValue({ refresh: jest.fn() } as unknown as ReturnType<typeof useRouter>)
})

describe('DropBlock', () => {
  it('shows edition, title, countdown and waitlist before the release', () => {
    render(<DropBlock drop={toDropView(sport, BEFORE)} now={BEFORE} />)
    expect(screen.getByText('Edition 02')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'OLYMPN Sport' })).toBeInTheDocument()
    expect(screen.getByText('Something is coming.')).toBeInTheDocument()
    expect(screen.getByText('1 November 2026 at 12:00 CET')).toBeInTheDocument()
    expect(screen.getByLabelText('Get notified when it drops')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Shop the drop' })).toBeNull()
  })

  it('shows Live now and a link to the drop once it is out', () => {
    render(<DropBlock drop={toDropView(sport, AFTER)} now={AFTER} />)
    expect(screen.getByText('Live now')).toBeInTheDocument()
    expect(screen.getByText('New in')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Shop the drop' })).toHaveAttribute('href', '/collections/olympn-sport')
    expect(screen.queryByText('Something is coming.')).toBeNull()
  })

  it('drops the New in badge once the drop is older than 30 days', () => {
    render(<DropBlock drop={toDropView(olympian, AFTER)} now={AFTER} />)
    expect(screen.getByText('Live now')).toBeInTheDocument()
    expect(screen.queryByText('New in')).toBeNull()
  })

  it('can be the page heading with the intro and without the self-link', () => {
    render(<DropBlock drop={toDropView(olympian, AFTER)} now={AFTER} as="h1" withIntro withLink={false} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Olympian' })).toBeInTheDocument()
    expect(screen.getByText(olympian.intro)).toBeInTheDocument()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('carries the tone for the stylesheet', () => {
    const { container } = render(<DropBlock drop={toDropView(sport, BEFORE)} now={BEFORE} />)
    expect(container.querySelector('section')).toHaveAttribute('data-tone', 'dark')
  })

  it('says a closed edition is closed', () => {
    const closed: Drop = { ...olympian, window: { startsAt: olympian.window.startsAt, endsAt: '2026-09-01T00:00:00+02:00' } }
    render(<DropBlock drop={toDropView(closed, AFTER)} now={AFTER} />)
    expect(screen.getByText('Released 19 June 2026. This edition is closed.')).toBeInTheDocument()
  })
})
