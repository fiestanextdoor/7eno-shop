import { render, screen } from '@testing-library/react'
import { BEELDMERK, WORDMARK, widthAt } from '@/lib/brand'
import Logo, { LogoBadge, LogoWordmark, toneFor } from './Logo'

const src = (img: HTMLElement) => decodeURIComponent(img.getAttribute('src') ?? '')

describe('Logo', () => {
  it('renders the navy v2 wordmark by default', () => {
    render(<LogoWordmark />)
    expect(src(screen.getByRole('img', { name: '7ENO' }))).toContain('/brand/7eno-wordmark-navy.png')
  })

  it('sizes the box from the natural ratio of the file', () => {
    const { container } = render(<LogoWordmark height={40} />)
    expect((container.firstChild as HTMLElement).style.width).toBe(`${widthAt(WORDMARK.navy, 40)}px`)
  })

  it('uses the cream wordmark on dark surfaces', () => {
    render(<LogoWordmark variant="cream" />)
    expect(src(screen.getByRole('img', { name: '7ENO' }))).toContain('/brand/7eno-wordmark-cream.png')
  })

  it('maps the v1 colour names onto the two tones', () => {
    expect(['wit', 'butter', 'cream'].map((v) => toneFor(v as 'wit'))).toEqual(['cream', 'cream', 'cream'])
    expect(['ink', 'zwart', 'blood', 'stone', 'navy'].map((v) => toneFor(v as 'ink'))).toEqual(['navy', 'navy', 'navy', 'navy', 'navy'])
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
