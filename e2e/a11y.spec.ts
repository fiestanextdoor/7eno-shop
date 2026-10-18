import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// WCAG 2.2 AA as far as axe checks it (spec section 9).
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const IMPACTS = ['critical', 'serious', 'moderate', 'minor'] as const

interface Finding {
  id: string
  impact: string
  help: string
  helpUrl: string
  targets: string[]
}

const results: { page: string; findings: Finding[] }[] = []

const CART_ITEM = {
  provider: 'printful', variantId: 'a11y-variant', productId: 'a11y-product', productName: 'Olympian Tee Ocean Unisex',
  variantName: 'Ocean / M', price: '34.95', currency: 'EUR', quantity: 1, imageUrl: null,
}

// The report lives in docs/qa, which must stay free of long dashes.
const plain = (text: string) => text.replace(/[\u2013\u2014]/g, '-').replace(/\|/g, '/')

async function scan(page: Page, name: string) {
  // Let open transitions (menu labels and drawers fade in) settle first; axe
  // measures contrast on the colour of the moment, mid-fade it reads too light.
  // Endless loops (the ticker) never finish, so only finite ones are awaited.
  // Bounded: a paused or very long finite animation must not hang the scan.
  await page.evaluate(() =>
    Promise.race([
      Promise.all(
        document
          .getAnimations()
          .filter((a) => a.effect?.getComputedTiming().endTime !== Infinity)
          .map((a) => a.finished.catch(() => null)),
      ),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]),
  )
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  results.push({
    page: name,
    findings: violations.map((v) => ({
      id: v.id,
      impact: v.impact ?? 'unknown',
      help: v.help,
      helpUrl: v.helpUrl,
      targets: v.nodes.map((n) => n.target.join(' ')),
    })),
  })
  expect(violations.map((v) => ({ id: v.id, impact: v.impact, targets: v.nodes.map((n) => n.target.join(' ')) }))).toEqual([])
}

function countBy(findings: Finding[], impact: string) {
  return findings.filter((f) => f.impact === impact).length
}

test.beforeEach(async ({ page }) => {
  // .env.local carries a live Stripe key: nothing in this scan may reach an order API or Stripe.
  await page.route('**/api/checkout**', (route) => route.abort())
  await page.route('**/api/promo/**', (route) => route.abort())
  await page.route(/stripe\.com/, (route) => route.abort())
})

test.afterAll(() => {
  const date = new Date().toISOString().slice(0, 10)
  const lines = [
    `# Accessibility scan, ${date}`,
    '',
    `axe (${TAGS.join(', ')}) via Playwright (Chromium) on a production build (\`next start\`). Requests to \`/api/checkout\`, \`/api/promo/*\` and \`stripe.com\` were blocked; no form field was filled in and no checkout button was pressed.`,
    '',
    'Counts are rules violated per page, by impact.',
    '',
    '| Page | Critical | Serious | Moderate | Minor | Rules |',
    '|---|---|---|---|---|---|',
    ...results.map((r) => {
      const counts = IMPACTS.map((impact) => countBy(r.findings, impact))
      const rules = r.findings.length === 0 ? 'none' : r.findings.map((f) => `${f.id} (${f.targets.length})`).join(', ')
      return `| ${r.page} | ${counts.join(' | ')} | ${rules} |`
    }),
    '',
    '## Findings',
    '',
  ]
  const all = results.flatMap((r) => r.findings.map((f) => ({ ...f, page: r.page })))
  if (all.length === 0) lines.push('None.', '')
  for (const impact of IMPACTS) {
    const group = all.filter((f) => f.impact === impact)
    if (group.length === 0) continue
    lines.push(`### ${impact[0].toUpperCase()}${impact.slice(1)}`, '')
    for (const f of group) {
      lines.push(`- ${f.page}: \`${f.id}\`. Fix: ${plain(f.help)} (${f.helpUrl})`)
      for (const t of f.targets.slice(0, 5)) lines.push(`  - \`${plain(t)}\``)
      if (f.targets.length > 5) lines.push(`  - and ${f.targets.length - 5} more`)
    }
    lines.push('')
  }
  const file = path.join(process.cwd(), 'docs/qa', `a11y-${date}.md`)
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, lines.join('\n'))
})

test('home', async ({ page }) => {
  await page.goto('/')
  await scan(page, 'Home')
})

test('PLP', async ({ page }) => {
  await page.goto('/shop')
  await scan(page, 'PLP /shop')
})

test('PDP', async ({ page }) => {
  await page.goto('/shop')
  const href = await page.locator('main a[href^="/shop/"]').first().getAttribute('href')
  expect(href).toBeTruthy()
  await page.goto(href as string)
  await scan(page, `PDP ${href}`)
})

test('cart drawer open with a line in it', async ({ page }) => {
  // A live product page from the sitemap (only purchasable products are listed
  // there), one real add to cart, then the drawer. This test never goes to /checkout.
  const sitemap = await (await page.request.get('/sitemap.xml')).text()
  const pdp = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => new URL(m[1].trim()).pathname)
    .find((p) => /^\/shop\/[^/]+$/.test(p))
  expect(pdp).toBeTruthy()
  await page.goto(pdp as string)
  const sizes = page.getByRole('radiogroup', { name: 'Size' })
  if (await sizes.count()) {
    await sizes.getByRole('radio').filter({ hasNotText: 'sold out' }).first().click()
  }
  await page.getByRole('button', { name: 'Add to cart', exact: true }).first().click()
  const drawer = page.getByRole('dialog', { name: 'Cart' })
  if (!(await drawer.isVisible())) await page.getByRole('button', { name: /^Open cart/ }).click()
  await expect(drawer).toBeVisible()
  await expect(drawer.getByRole('listitem').first()).toBeVisible()
  await scan(page, `Cart drawer open, one line from ${pdp}`)
})

test('checkout with one line in the cart, nothing filled in', async ({ page }) => {
  await page.addInitScript((item) => {
    window.localStorage.setItem('7eno-cart-v2', JSON.stringify({ state: { items: [item] }, version: 2 }))
  }, CART_ITEM)
  await page.goto('/checkout')
  await expect(page.getByText('Olympian Tee Ocean Unisex').first()).toBeVisible()
  await scan(page, 'Checkout')
})

test.describe('mobile', () => {
  test.use({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true })

  test('menu open', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Open menu' }).click()
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible()
    await scan(page, 'Mobile menu open')
  })
})
