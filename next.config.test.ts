/** @jest-environment node */
import nextConfig from './next.config'

async function redirects() {
  return (await nextConfig.redirects?.()) ?? []
}

describe('next.config redirects', () => {
  it('sends the retired v1 routes permanently to their v2 homes', async () => {
    expect(await redirects()).toEqual(
      expect.arrayContaining([
        { source: '/olympian', destination: '/collections/olympian', permanent: true },
        { source: '/deals', destination: '/shop', permanent: true },
        { source: '/deals/:slug', destination: '/shop', permanent: true },
        { source: '/coming-soon', destination: '/', permanent: true },
        {
          source: '/shop',
          has: [{ type: 'query', key: 'line', value: 'olympian' }],
          destination: '/collections/olympian',
          permanent: true,
        },
      ])
    )
  })

  it('never redirects /shop to itself: the passed-through query would loop', async () => {
    for (const r of await redirects()) {
      expect(r.source === '/shop' && r.destination === '/shop').toBe(false)
    }
  })
})
