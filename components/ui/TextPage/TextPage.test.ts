/** @jest-environment node */
import { existsSync, readFileSync } from 'node:fs'
import { missingClasses, nonV2Vars, stylesImport } from '../../../test-utils/css-module-classes'

const MODULE = 'components/ui/TextPage/TextPage.module.css'
const PAGES = [
  'app/about/page.tsx',
  'app/faq/page.tsx',
  'app/size-guide/page.tsx',
  'app/returns/page.tsx',
  'app/terms/page.tsx',
  'app/privacy/page.tsx',
]

describe.each(PAGES)('%s', (page) => {
  it('uses the shared text page stylesheet', () => {
    expect(stylesImport(page)).toBe('@/components/ui/TextPage/TextPage.module.css')
  })

  it('only uses classes that stylesheet defines', () => {
    expect(missingClasses(page, MODULE)).toEqual([])
  })

  it('no longer carries the v1 theme class', () => {
    expect(readFileSync(page, 'utf8')).not.toMatch(/oly-(theme|palette)/)
  })
})

describe('TextPage stylesheet', () => {
  it('reads v2 tokens only', () => {
    expect(nonV2Vars(MODULE)).toEqual([])
  })

  it('replaces the three legal stylesheets', () => {
    for (const file of ['app/returns/returns.module.css', 'app/terms/terms.module.css', 'app/privacy/privacy.module.css']) {
      expect(existsSync(file)).toBe(false)
    }
  })
})
