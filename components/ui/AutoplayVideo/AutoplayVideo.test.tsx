import { render } from '@testing-library/react'
import AutoplayVideo, { AUTOPLAY_QUERY } from './AutoplayVideo'

const props = {
  src: '/brand/ad-dune.mp4',
  poster: '/brand/ad-dune-poster.jpg',
  label: 'OLYMPN Sport ad in Dune',
  width: 720,
  height: 1280,
}

function mockMatchMedia(matches: boolean) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: query === AUTOPLAY_QUERY ? matches : false,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })) as unknown as typeof window.matchMedia
}

let play: jest.SpyInstance

beforeEach(() => {
  play = jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
  jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
})

afterEach(() => {
  jest.restoreAllMocks()
  delete (window as { matchMedia?: unknown }).matchMedia
})

const video = (container: HTMLElement) => container.querySelector('video') as HTMLVideoElement

describe('AutoplayVideo', () => {
  it('never preloads and always shows its poster', () => {
    mockMatchMedia(false)
    const { container } = render(<AutoplayVideo {...props} />)
    const v = video(container)
    expect(v).toHaveAttribute('preload', 'none')
    expect(v).toHaveAttribute('poster', props.poster)
    expect(v).toHaveAttribute('playsinline')
    expect(v.muted).toBe(true)
    expect(v).toHaveAttribute('aria-label', props.label)
    expect(v.querySelector('source')).toHaveAttribute('src', props.src)
  })

  it('does not autoplay on a phone and offers controls instead', () => {
    mockMatchMedia(false)
    const { container } = render(<AutoplayVideo {...props} />)
    expect(play).not.toHaveBeenCalled()
    expect(video(container)).toHaveAttribute('controls')
  })

  it('plays muted on a wide screen without reduced motion', () => {
    mockMatchMedia(true)
    const { container } = render(<AutoplayVideo {...props} />)
    expect(play).toHaveBeenCalledTimes(1)
    expect(video(container)).not.toHaveAttribute('controls')
  })

  it('stays still where matchMedia does not exist', () => {
    render(<AutoplayVideo {...props} />)
    expect(play).not.toHaveBeenCalled()
  })

  it('swallows a refused autoplay', async () => {
    mockMatchMedia(true)
    play.mockRejectedValue(new Error('NotAllowedError'))
    const { container } = render(<AutoplayVideo {...props} />)
    await Promise.resolve()
    expect(video(container)).toBeInTheDocument()
  })
})
