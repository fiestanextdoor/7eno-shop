/** @jest-environment node */
import { meetsTarget, pickPdpPath, renderReport, summarise, warmUp } from './lighthouse-report.mjs'

const SITEMAP = `<?xml version="1.0"?><urlset>
  <url><loc>https://www.7eno.shop/</loc></url>
  <url><loc>https://www.7eno.shop/shop</loc></url>
  <url><loc> https://www.7eno.shop/shop/olympian-tee-ocean-unisex </loc></url>
  <url><loc>https://www.7eno.shop/shop/olympian-tee-sand-unisex</loc></url>
</urlset>`

const summary = (score: number) => ({
  performance: score, accessibility: 100, bestPractices: 100, seo: 100, lcp: '2.1 s', cls: '0', tbt: '120 ms',
})

describe('pickPdpPath', () => {
  it('takes the first product page from the sitemap', () => {
    expect(pickPdpPath(SITEMAP)).toBe('/shop/olympian-tee-ocean-unisex')
  })

  it('returns null when no product is live', () => {
    expect(pickPdpPath('<urlset><url><loc>https://x/shop</loc></url></urlset>')).toBeNull()
  })
})

describe('warmUp', () => {
  it('requests every path twice before anything is measured, without following redirects', async () => {
    const calls: string[] = []
    const fakeFetch = jest.fn(async (url: string, init?: RequestInit) => {
      calls.push(`${url} ${init?.redirect}`)
      return { status: url.endsWith('/shop') ? 200 : 308 } as Response
    })
    const statuses = await warmUp('http://localhost:3100', ['/', '/shop'], fakeFetch as unknown as typeof fetch)
    expect(calls).toEqual([
      'http://localhost:3100/ manual', 'http://localhost:3100/ manual',
      'http://localhost:3100/shop manual', 'http://localhost:3100/shop manual',
    ])
    expect(statuses).toEqual({ '/': [308, 308], '/shop': [200, 200] })
  })
})

describe('summarise and meetsTarget', () => {
  it('turns Lighthouse scores into whole numbers and reads the vitals', () => {
    const lhr = {
      categories: { performance: { score: 0.894 }, accessibility: { score: 1 }, 'best-practices': { score: 0.96 }, seo: { score: 1 } },
      audits: {
        'largest-contentful-paint': { displayValue: '2.4 s' },
        'cumulative-layout-shift': { displayValue: '0.01' },
        'total-blocking-time': { displayValue: '90 ms' },
      },
    }
    expect(summarise(lhr)).toEqual({
      performance: 89, accessibility: 100, bestPractices: 96, seo: 100, lcp: '2.4 s', cls: '0.01', tbt: '90 ms',
    })
  })

  it('needs 90 on every category', () => {
    expect(meetsTarget(summary(90))).toBe(true)
    expect(meetsTarget(summary(89))).toBe(false)
  })
})

describe('renderReport', () => {
  const report = renderReport({
    date: '2026-10-20',
    base: 'http://localhost:3100',
    lighthouseVersion: '13.5.0',
    warm: { '/': [200, 200], '/shop': [200, 200] },
    rows: [
      { name: 'Home', path: '/', summary: summary(93) },
      { name: 'PLP', path: '/shop', summary: summary(85) },
      { name: 'PDP', path: null, summary: null },
    ],
  })

  it('has a table row per page with the verdict', () => {
    expect(report).toContain('# Lighthouse, 2026-10-20')
    expect(report).toContain('| Home | `/` | 93 | 100 | 100 | 100 | 2.1 s | 0 | 120 ms | met |')
    expect(report).toContain('| PLP | `/shop` | 85 | 100 | 100 | 100 | 2.1 s | 0 | 120 ms | not met |')
    expect(report).toContain('| PDP | none live | skipped |')
  })

  it('records the warm-up and lists what is below target', () => {
    expect(report).toContain('- `/`: 200, 200')
    expect(report).toContain('- PLP: performance 85')
  })

  it('contains no long dashes', () => {
    expect(report).not.toMatch(/[\u2013\u2014]/)
  })
})
