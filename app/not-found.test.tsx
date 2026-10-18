import { render, screen, within } from '@testing-library/react'
import NotFound from './not-found'

describe('404', () => {
  it('shows a big 404, one sentence and the way back', () => {
    jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-14T10:00:00Z'))
    render(<NotFound />)
    expect(screen.getByRole('heading', { level: 1, name: '404' })).toBeInTheDocument()
    expect(screen.getByText('This page is not part of any edition.')).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Where to next' })
    expect(within(nav).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual([
      '/collections/olympn-sport',
      '/collections/olympian',
      '/shop',
      '/archive',
    ])
    jest.restoreAllMocks()
  })
})
