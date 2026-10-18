import { render, screen } from '@testing-library/react'
import ArchivePage from './page'

const mockIsPreviewSession = jest.fn()
jest.mock('../../lib/preview-session', () => ({ isPreviewSession: () => mockIsPreviewSession() }))

beforeEach(() => {
  jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-14T10:00:00Z'))
  mockIsPreviewSession.mockReset().mockResolvedValue(false)
})

afterEach(() => jest.restoreAllMocks())

describe('/archive', () => {
  it('lists every edition, newest first, each linking to its collection', async () => {
    render(await ArchivePage())
    expect(screen.getByRole('heading', { level: 1, name: 'Every edition' })).toBeInTheDocument()
    const titles = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(titles).toEqual(['OLYMPN Sport', 'Olympian'])
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(hrefs).toEqual(['/collections/olympn-sport', '/collections/olympian'])
  })

  it('never lists the OG range, which is not an edition', async () => {
    render(await ArchivePage())
    expect(screen.queryByText(/\bOG\b/)).toBeNull()
  })
})
