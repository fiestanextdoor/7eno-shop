import { render, screen } from '@testing-library/react'
import Badge from './Badge'

describe('Badge', () => {
  it.each([
    ['new', 'New in'],
    ['coming', 'Coming soon'],
    ['sold-out', 'Sold out'],
  ] as const)('renders the %s badge with its fixed label', (kind, label) => {
    render(<Badge kind={kind} />)
    const badge = screen.getByText(label)
    expect(badge).toHaveAttribute('data-kind', kind)
    expect(badge).toHaveClass('badge', kind)
  })

  it('renders an edition badge with the given text', () => {
    render(<Badge kind="edition">Edition 02</Badge>)
    expect(screen.getByText('Edition 02')).toHaveAttribute('data-kind', 'edition')
  })

  it('lets a caller override the fixed label', () => {
    render(<Badge kind="coming">Drops 1 November</Badge>)
    expect(screen.getByText('Drops 1 November')).toBeInTheDocument()
    expect(screen.queryByText('Coming soon')).toBeNull()
  })
})
