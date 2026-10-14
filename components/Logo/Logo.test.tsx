import { render, screen } from '@testing-library/react'
import { BEELDMERK, WORDMARK, widthAt } from '@/lib/brand'
import Logo, { LogoBadge, LogoWordmark } from './Logo'

const src = (img: HTMLElement) => decodeURIComponent(img.getAttribute('src') ?? '')

describe('Logo', () => {
  it('renders the navy v2 wordmark by default', () => {
    render(<LogoWordmark />)
    expect(src(screen.getByRole('img', { name: '7ENO' }))).toContain('/brand/7eno-wordmark-navy.png')
  })

  it('gives the image explicit dimensions from the natural ratio of the file', () => {
    render(<LogoWordmark height={40} />)
    const img = screen.getByRole('img', { name: '7ENO' })
    expect(img).toHaveAttribute('width', String(widthAt(WORDMARK.navy, 40)))
    expect(img).toHaveAttribute('height', '40')
    expect(src(img)).toContain(WORDMARK.navy.src)
  })

  it('reserves the cream box with the same explicit dimensions', () => {
    render(<LogoWordmark variant="cream" height={48} />)
    const img = screen.getByRole('img', { name: '7ENO' })
    expect(img).toHaveAttribute('width', String(widthAt(WORDMARK.cream, 48)))
    expect(img).toHaveAttribute('height', '48')
  })

  it('uses the cream wordmark on dark surfaces', () => {
    render(<LogoWordmark variant="cream" />)
    expect(src(screen.getByRole('img', { name: '7ENO' }))).toContain('/brand/7eno-wordmark-cream.png')
  })

  it('loads eagerly when it is above the fold', () => {
    render(<LogoWordmark priority />)
    const img = screen.getByRole('img', { name: '7ENO' })
    expect(img).toHaveAttribute('loading', 'eager')
    expect(img).toHaveAttribute('fetchpriority', 'high')
  })

  it('renders the mark as decoration', () => {
    const { container } = render(<LogoBadge variant="navy" size={48} />)
    const img = container.querySelector('img') as HTMLImageElement
    expect(img).toHaveAttribute('alt', '')
    expect(src(img)).toContain(BEELDMERK.navy.src)
  })

  it('keeps the default export as a wordmark', () => {
    render(<Logo />)
    expect(screen.getByRole('img', { name: '7ENO' })).toBeInTheDocument()
  })
})
