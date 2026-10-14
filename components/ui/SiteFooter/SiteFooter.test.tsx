import { render, screen } from '@testing-library/react'
import SiteFooter from './SiteFooter'
import { MAIN_NAV } from '@/lib/nav'

describe('SiteFooter', () => {
  it('repeats the main navigation', () => {
    render(<SiteFooter nav={MAIN_NAV} />)
    const shop = screen.getByRole('navigation', { name: 'Footer shop' })
    for (const item of MAIN_NAV) {
      expect(shop.querySelector(`a[href="${item.href}"]`)).toHaveTextContent(item.label)
    }
  })

  it('links help, contact and the legal pages', () => {
    render(<SiteFooter nav={MAIN_NAV} />)
    expect(screen.getByRole('link', { name: 'Size guide' })).toHaveAttribute('href', '/size-guide')
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', 'mailto:info@7eno.shop')
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms')
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy')
  })

  it('carries the company line', () => {
    render(<SiteFooter nav={MAIN_NAV} />)
    expect(screen.getByText(/KvK 42081073/)).toBeInTheDocument()
  })

  it('offers drop alerts', () => {
    render(<SiteFooter nav={MAIN_NAV} />)
    expect(screen.getByLabelText('Email for drop alerts')).toBeInTheDocument()
  })

  it('carries the cream v2 wordmark on the navy footer', () => {
    render(<SiteFooter nav={MAIN_NAV} />)
    const img = screen.getByRole('img', { name: '7ENO' })
    expect(decodeURIComponent(img.getAttribute('src') ?? '')).toContain('/brand/7eno-wordmark-cream.png')
  })
})
