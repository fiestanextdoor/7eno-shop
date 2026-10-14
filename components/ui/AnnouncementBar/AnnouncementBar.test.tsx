import { render, screen, fireEvent } from '@testing-library/react'
import AnnouncementBar from './AnnouncementBar'

const MESSAGES = ['Free shipping on orders over €75', '14-day returns']

describe('AnnouncementBar', () => {
  it('reads each message once and hides the loop copy from assistive tech', () => {
    const { container } = render(<AnnouncementBar messages={MESSAGES} />)
    for (const m of MESSAGES) {
      const copies = screen.getAllByText(m)
      expect(copies).toHaveLength(2)
      expect(copies.filter((el) => el.getAttribute('aria-hidden') === 'true')).toHaveLength(1)
    }
    expect(container.querySelector('[data-announcement-track]')).not.toBeNull()
  })

  it('can be paused and resumed', () => {
    const { container } = render(<AnnouncementBar messages={MESSAGES} />)
    const toggle = screen.getByRole('button', { name: 'Pause announcements' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(container.querySelector('[data-paused="true"]')).not.toBeNull()
  })

  it('wraps the messages in a link when given an href', () => {
    render(<AnnouncementBar messages={MESSAGES} href="/collections/olympn-sport" />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/collections/olympn-sport')
  })

  it('renders nothing without messages', () => {
    const { container } = render(<AnnouncementBar messages={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
