import { render, screen } from '@testing-library/react'
import EditionCard from './EditionCard'
import { getDrop, toDropView, type Drop } from '@/lib/drops'

const sport = getDrop('olympn-sport') as Drop
const olympian = getDrop('olympian') as Drop
const BEFORE = Date.parse('2026-10-14T10:00:00Z')

describe('EditionCard', () => {
  it('shows edition, title, release window and status, linking to the collection', () => {
    render(<EditionCard drop={toDropView(sport, BEFORE)} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/collections/olympn-sport')
    expect(screen.getByText('Edition 02')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'OLYMPN Sport' })).toBeInTheDocument()
    expect(screen.getByText('Drops 1 November 2026 at 12:00 CET')).toBeInTheDocument()
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
  })

  it('shows a released edition as live', () => {
    render(<EditionCard drop={toDropView(olympian, BEFORE)} />)
    expect(screen.getByText('Released 19 June 2026')).toBeInTheDocument()
    expect(screen.getByText('Live now')).toBeInTheDocument()
  })

  it('shows a closed edition with its closed label', () => {
    const closed = { ...toDropView(olympian, BEFORE), status: 'closed' as const }
    render(<EditionCard drop={closed} />)
    expect(screen.getByText('Released 19 June 2026, now closed')).toBeInTheDocument()
    expect(screen.getByText('Closed')).toBeInTheDocument()
    expect(screen.queryByText('Live now')).toBeNull()
  })

  it('shows a strip of four images from the line-up', () => {
    const { container } = render(<EditionCard drop={toDropView(sport, BEFORE)} />)
    expect(container.querySelectorAll('img')).toHaveLength(4)
  })
})
