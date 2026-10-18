/** @jest-environment node */
import { readFileSync } from 'node:fs'
import { missingClasses, nonV2Vars } from '../../test-utils/css-module-classes'

const LAYOUT_CSS = 'app/account/(protected)/account.layout.module.css'
const LOGIN_CSS = 'app/account/login/login.module.css'
const PAIRS: [string, string][] = [
  ['app/account/(protected)/layout.tsx', LAYOUT_CSS],
  ['app/account/(protected)/AccountLogout.tsx', LAYOUT_CSS],
  ['app/account/login/page.tsx', LOGIN_CSS],
  ['app/account/register/page.tsx', LOGIN_CSS],
  ['app/account/(protected)/dashboard/page.tsx', 'app/account/(protected)/dashboard/dashboard.module.css'],
  ['app/account/(protected)/profile/page.tsx', 'app/account/(protected)/profile/profile.module.css'],
  ['app/account/(protected)/orders/page.tsx', 'app/account/(protected)/orders/orders.module.css'],
]

describe('account styles', () => {
  it.each(PAIRS)('%s only uses classes its module defines', (component, css) => {
    expect(missingClasses(component, css)).toEqual([])
  })

  it.each([...new Set(PAIRS.map(([, css]) => css))])('%s reads v2 tokens only', (css) => {
    expect(nonV2Vars(css)).toEqual([])
  })

  it('register no longer inlines v1 tokens', () => {
    expect(readFileSync('app/account/register/page.tsx', 'utf8')).not.toMatch(/var\(--(font-sans|stone)\)/)
  })

  it('ties every profile label to its field', () => {
    const source = readFileSync('app/account/(protected)/profile/page.tsx', 'utf8')
    const labels = [...source.matchAll(/<label htmlFor="([a-z0-9-]+)"/g)].map((m) => m[1])
    expect(labels).toEqual(['profile-name', 'profile-line1', 'profile-line2', 'profile-postal', 'profile-city', 'profile-country'])
    for (const id of labels) expect(source).toContain(`id="${id}"`)
  })
})
