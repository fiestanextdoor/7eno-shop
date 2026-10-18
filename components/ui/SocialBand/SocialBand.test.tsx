import { render, screen, within } from '@testing-library/react'
import SocialBand from './SocialBand'
import { INSTAGRAM_FALLBACK } from '@/lib/social'

describe('SocialBand', () => {
  it('links both profiles in a new tab and shows every post as a link to Instagram', () => {
    render(<SocialBand posts={INSTAGRAM_FALLBACK} />)
    const instagram = screen.getByRole('link', { name: '@7enobyabraent' })
    expect(instagram).toHaveAttribute('href', 'https://www.instagram.com/7enobyabraent/')
    expect(instagram).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByRole('link', { name: '@7enobyabraentertainment' })).toHaveAttribute('href', 'https://www.tiktok.com/@7enobyabraentertainment')
    const grid = screen.getByRole('list', { name: 'Latest Instagram posts' })
    const posts = within(grid).getAllByRole('link')
    expect(posts).toHaveLength(4)
    expect(posts[0]).toHaveAttribute('href', INSTAGRAM_FALLBACK[0].permalink)
    expect(within(posts[0]).getByText('Reel')).toBeInTheDocument()
    expect(within(posts[1]).queryByText('Reel')).toBeNull()
  })

  it('leaves the grid out without posts', () => {
    render(<SocialBand posts={[]} />)
    expect(screen.queryByRole('list')).toBeNull()
  })
})
