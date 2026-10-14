/** Pure helpers for scripts/lighthouse-report.mjs. */

export const TARGET = 90

/** First product page in a sitemap; only live products are listed there. */
export function pickPdpPath(sitemapXml) {
  for (const match of sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const { pathname } = new URL(match[1].trim())
    if (/^\/shop\/[^/]+$/.test(pathname)) return pathname
  }
  return null
}

/**
 * Requests every path `times` times before measuring, so the Printful fetch
 * cache and the ISR pages are warm: a cold first render is not what visitors
 * get. Redirects are not followed, so a 308 shows up in the report.
 */
export async function warmUp(base, paths, fetchImpl = fetch, times = 2) {
  const statuses = {}
  for (const p of paths) {
    statuses[p] = []
    for (let i = 0; i < times; i += 1) {
      const res = await fetchImpl(new URL(p, base).href, { redirect: 'manual' })
      statuses[p].push(res.status)
    }
  }
  return statuses
}

/** Scores (0-100) and three vitals from a Lighthouse result object. */
export function summarise(lhr) {
  const score = (id) => Math.round((lhr.categories[id]?.score ?? 0) * 100)
  const audit = (id) => lhr.audits[id]?.displayValue ?? 'n/a'
  return {
    performance: score('performance'),
    accessibility: score('accessibility'),
    bestPractices: score('best-practices'),
    seo: score('seo'),
    lcp: audit('largest-contentful-paint'),
    cls: audit('cumulative-layout-shift'),
    tbt: audit('total-blocking-time'),
  }
}

export function meetsTarget(summary, target = TARGET) {
  return [summary.performance, summary.accessibility, summary.bestPractices, summary.seo].every((s) => s >= target)
}

export function renderReport({ date, base, rows, warm, lighthouseVersion }) {
  const lines = [
    `# Lighthouse, ${date}`,
    '',
    `Mobile preset (Lighthouse ${lighthouseVersion} defaults: phone emulation, simulated slow 4G), production build via \`next start\` on ${base}. Every page was requested twice before measuring (warm-up below). Target: ${TARGET} or more on every category (spec section 9).`,
    '',
    'Cache note: the warm-up fills the server side caches (Printful fetch cache, ISR pages). Lighthouse itself starts every run with an empty browser cache, so the numbers are a first visit on a warm server, not a repeat visit.',
    '',
    '| Page | Path | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT | Target |',
    '|---|---|---|---|---|---|---|---|---|---|',
  ]
  for (const row of rows) {
    if (!row.summary) {
      lines.push(`| ${row.name} | none live | skipped |`)
      continue
    }
    const s = row.summary
    const verdict = meetsTarget(s) ? 'met' : 'not met'
    lines.push(`| ${row.name} | \`${row.path}\` | ${s.performance} | ${s.accessibility} | ${s.bestPractices} | ${s.seo} | ${s.lcp} | ${s.cls} | ${s.tbt} | ${verdict} |`)
  }
  lines.push('', '## Warm-up', '', 'HTTP status of the two warm-up requests per path (redirects not followed).', '')
  for (const [p, statuses] of Object.entries(warm)) lines.push(`- \`${p}\`: ${statuses.join(', ')}`)
  lines.push('', '## Below target', '')
  const below = rows.flatMap((row) => {
    if (!row.summary) return []
    const s = row.summary
    const parts = [
      ['performance', s.performance], ['accessibility', s.accessibility], ['best practices', s.bestPractices], ['seo', s.seo],
    ].filter(([, score]) => score < TARGET)
    return parts.map(([label, score]) => `- ${row.name}: ${label} ${score}`)
  })
  lines.push(...(below.length > 0 ? below : ['None.']), '')
  return lines.join('\n')
}
