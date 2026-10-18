import { getInstagramPosts, toSocialPost } from './instagram'
import { INSTAGRAM_FALLBACK } from './social'

const ORIGINAL_ENV = process.env
// jsdom has no fetch: install one to spy on and remove it again afterwards.
const fetchMock = jest.fn()

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV }
  delete process.env.INSTAGRAM_ACCESS_TOKEN
  fetchMock.mockReset()
  Object.defineProperty(global, 'fetch', { value: fetchMock, configurable: true, writable: true })
})

afterEach(() => {
  process.env = ORIGINAL_ENV
  jest.restoreAllMocks()
})

describe('getInstagramPosts', () => {
  it('shows the saved posts without a token', async () => {
    expect(await getInstagramPosts()).toEqual(INSTAGRAM_FALLBACK)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('maps the live feed, video thumbnails included, four at most', async () => {
    process.env.INSTAGRAM_ACCESS_TOKEN = 'token'
    const data = [
      { id: '1', caption: 'Drop day  \n soon', media_type: 'VIDEO', thumbnail_url: 'https://cdn/1.jpg', permalink: 'https://www.instagram.com/reel/a/' },
      { id: '2', media_type: 'IMAGE', media_url: 'https://cdn/2.jpg', permalink: 'https://www.instagram.com/p/b/' },
      { id: '3', media_type: 'CAROUSEL_ALBUM', media_url: 'https://cdn/3.jpg', permalink: 'https://www.instagram.com/p/c/' },
      { id: '4', media_type: 'IMAGE', permalink: 'https://www.instagram.com/p/d/' },
      { id: '5', media_type: 'IMAGE', media_url: 'https://cdn/5.jpg', permalink: 'https://www.instagram.com/p/e/' },
      { id: '6', media_type: 'IMAGE', media_url: 'https://cdn/6.jpg', permalink: 'https://www.instagram.com/p/f/' },
    ]
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ data }) })
    const posts = await getInstagramPosts()
    expect(posts.map((p) => p.id)).toEqual(['1', '2', '3', '5'])
    expect(posts[0]).toEqual({ id: '1', permalink: 'https://www.instagram.com/reel/a/', image: 'https://cdn/1.jpg', alt: 'Drop day soon', kind: 'video' })
  })

  it('falls back when Instagram errors', async () => {
    process.env.INSTAGRAM_ACCESS_TOKEN = 'token'
    jest.spyOn(console, 'error').mockImplementation(() => {})
    fetchMock.mockResolvedValue({ ok: false, status: 400 })
    expect(await getInstagramPosts()).toEqual(INSTAGRAM_FALLBACK)
  })

  it('skips an item without a picture', () => {
    expect(toSocialPost({ id: 'x', media_type: 'VIDEO', permalink: 'https://www.instagram.com/reel/x/' })).toBeNull()
  })
})
