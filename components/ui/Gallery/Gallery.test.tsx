import { fireEvent, render, screen } from '@testing-library/react'
import type { GalleryImage } from '@/lib/product-gallery'
import Gallery from './Gallery'

const IMAGES: GalleryImage[] = [
  { src: '/drops/olympn-sport/mocha.webp', alt: 'Hoodie Mocha, front' },
  { src: '/drops/olympn-sport/dune.webp', alt: 'Hoodie Mocha, back' },
  { src: '/drops/olympn-sport/olive.webp', alt: 'Hoodie Mocha, view 3' },
]

const scrollIntoView = jest.fn()

beforeEach(() => {
  scrollIntoView.mockReset()
  Element.prototype.scrollIntoView = scrollIntoView
})

describe('Gallery', () => {
  it('renders every image, the first one eager and high priority', () => {
    render(<Gallery images={IMAGES} label="Hoodie Mocha" />)
    const imgs = screen.getAllByRole('img', { name: /Hoodie Mocha,/ })
    expect(imgs.map((img) => img.getAttribute('alt'))).toEqual(IMAGES.map((i) => i.alt))
    expect(imgs[0]).toHaveAttribute('fetchpriority', 'high')
    expect(imgs[0]).toHaveAttribute('loading', 'eager')
    expect(imgs[1]).toHaveAttribute('loading', 'lazy')
  })

  it('selects an image from its thumbnail and scrolls to it', () => {
    render(<Gallery images={IMAGES} label="Hoodie Mocha" />)
    const thumbs = screen.getAllByRole('button', { name: /Show image/ })
    expect(thumbs).toHaveLength(3)
    expect(thumbs[0]).toHaveAttribute('aria-current', 'true')
    fireEvent.click(thumbs[2])
    expect(thumbs[2]).toHaveAttribute('aria-current', 'true')
    expect(thumbs[0]).not.toHaveAttribute('aria-current')
    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    expect(scrollIntoView.mock.contexts[0]).toBe(screen.getByRole('img', { name: 'Hoodie Mocha, view 3' }).closest('li'))
    expect(screen.getByText('3 / 3')).toBeInTheDocument()
  })

  it('follows a swipe on the mobile strip', () => {
    render(<Gallery images={IMAGES} label="Hoodie Mocha" />)
    const track = screen.getByRole('list', { name: /swipe/ })
    Object.defineProperty(track, 'clientWidth', { value: 300, configurable: true })
    Object.defineProperty(track, 'scrollLeft', { value: 300, configurable: true })
    fireEvent.scroll(track)
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })

  it('shows no thumbnails or counter for a single image', () => {
    render(<Gallery images={IMAGES.slice(0, 1)} label="Hoodie Mocha" />)
    expect(screen.queryByRole('button', { name: /Show image/ })).toBeNull()
    expect(screen.queryByText('1 / 1')).toBeNull()
  })

  it('keeps the 4:5 surface when there is no image yet', () => {
    render(<Gallery images={[]} label="Hoodie Mocha" />)
    expect(screen.getByRole('img', { name: 'Hoodie Mocha, no image yet' })).toBeInTheDocument()
  })
})
