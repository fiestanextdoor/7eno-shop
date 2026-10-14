import { readFileSync } from 'node:fs'
import path from 'node:path'

const css = readFileSync(path.join(process.cwd(), 'styles/tokens.css'), 'utf8')
const layout = readFileSync(path.join(process.cwd(), 'app/layout.tsx'), 'utf8')

/** The full block that opens with `selector {`, braces balanced. */
function block(source: string, selector: string): string {
  const start = source.indexOf(`${selector} {`)
  if (start === -1) return ''
  let depth = 0
  for (let i = source.indexOf('{', start); i < source.length; i++) {
    if (source[i] === '{') depth++
    if (source[i] === '}') {
      depth--
      if (depth === 0) return source.slice(start, i + 1)
    }
  }
  return ''
}

const root = block(css, ':root')

const TOKENS: [string, string][] = [
  ['--c-bg', '#F7F1DA'],
  ['--c-surface', '#FFFFFF'],
  ['--c-stone', '#C4C4B5'],
  ['--c-text', '#2D3A4F'],
  ['--c-text-muted', '#5B5A58'],
  ['--c-border-strong', '#8A897F'],
  ['--c-accent', '#7995C7'],
  ['--c-accent-ink', '#3E5A8F'],
  ['--c-live', '#FEAB27'],
  ['--c-sage', '#BACCB1'],
  ['--c-rose', '#E8697D'],
  ['--c-peach', '#F5C190'],
  ['--c-inverse-bg', '#2D3A4F'],
  ['--c-inverse-text', '#F7F1DA'],
  ['--c-success', '#3E5A2E'],
  ['--c-error', '#A32020'],
  ['--c-focus', '#2D3A4F'],
  ['--c-swatch-rose-red', '#621926'],
  ['--c-swatch-pistachio', '#9CAF92'],
  ['--c-swatch-mocha', '#9E7551'],
  ['--c-swatch-obsidian', '#0E0B0B'],
  ['--c-swatch-dune', '#C3B99C'],
  ['--c-swatch-olive', '#3C3D2E'],
  ['--c-swatch-maritime', '#071429'],
  ['--f-display', "var(--font-archivo), 'Archivo Black', 'Arial Black', sans-serif"],
  ['--f-display-italic', 'var(--font-archivo-italic), var(--f-display)'],
  ['--f-body', 'var(--font-instrument), system-ui, sans-serif'],
  ['--f-mono', 'var(--font-plex-mono), ui-monospace, monospace'],
  ['--fs-display', 'clamp(2.75rem, 8vw, 7.5rem)'],
  ['--fs-h1', 'clamp(2rem, 5vw, 4rem)'],
  ['--fs-h2', 'clamp(1.5rem, 3vw, 2.25rem)'],
  ['--fs-h3', '1.25rem'],
  ['--fs-body', '1rem'],
  ['--fs-small', '0.875rem'],
  ['--fs-label', '0.75rem'],
  ['--s-1', '4px'],
  ['--s-2', '8px'],
  ['--s-3', '12px'],
  ['--s-4', '16px'],
  ['--s-5', '24px'],
  ['--s-6', '32px'],
  ['--s-7', '48px'],
  ['--s-8', '64px'],
  ['--s-9', '96px'],
  ['--s-10', '128px'],
  ['--r-0', '0'],
  ['--r-1', '2px'],
  ['--l-gutter', '16px'],
  ['--l-grid-gap', '2px'],
  ['--l-max', '1600px'],
  ['--l-text-max', '68ch'],
  ['--l-nav', '56px'],
  ['--l-announce', '32px'],
  ['--l-chrome', 'calc(var(--l-announce) + var(--l-nav))'],
  ['--m-fast', '120ms'],
  ['--m-base', '200ms'],
  ['--m-slow', '400ms'],
  ['--m-ease', 'cubic-bezier(0.2, 0, 0, 1)'],
  ['--m-ease-out', 'cubic-bezier(0.16, 1, 0.3, 1)'],
]

describe('styles/tokens.css', () => {
  it.each(TOKENS)('defines %s as %s on :root', (name, value) => {
    expect(root).toContain(`${name}: ${value};`)
  })

  it('steps the gutter and nav height up at the spec breakpoints', () => {
    expect(block(css, '@media (min-width: 768px)')).toContain('--l-gutter: 24px;')
    expect(block(css, '@media (min-width: 1024px)')).toContain('--l-nav: 64px;')
    expect(block(css, '@media (min-width: 1200px)')).toContain('--l-gutter: 32px;')
  })

  it('collapses every duration and stops the announcement bar under reduced motion', () => {
    const reduced = block(css, '@media (prefers-reduced-motion: reduce)')
    for (const name of ['--m-fast', '--m-base', '--m-slow']) {
      expect(reduced).toContain(`${name}: 0.01ms;`)
    }
    expect(reduced).toContain('[data-announcement-track]')
    expect(reduced).toContain('animation: none')
  })

  it('declares only the v2 prefixes (c, f, fs, s, r, l, m)', () => {
    const declared = [...css.matchAll(/(--[a-z0-9-]+):/g)].map((m) => m[1])
    expect(declared.length).toBeGreaterThan(50)
    for (const name of declared) expect(name).toMatch(/^--(c|f|fs|s|r|l|m)-/)
  })

  it('loads Archivo italic as its own font without a preload', () => {
    const italic = layout.slice(layout.indexOf('const archivoItalic = Archivo('))
    const options = italic.slice(0, italic.indexOf('})'))
    expect(options).toContain("style: ['italic']")
    expect(options).toContain('preload: false')
    expect(options).toContain("variable: '--font-archivo-italic'")
    expect(layout).toMatch(/const archivo = Archivo\(\{[^}]*style: \['normal'\][^}]*preload: true/)
    expect(layout).toContain('${archivoItalic.variable}')
  })

  it.each([
    'app/not-found.module.css', 'app/page.module.css', 'app/success/success.module.css',
    'components/ui/DropBlock/DropBlock.module.css', 'components/ui/EditionCard/EditionCard.module.css',
  ])('%s sets italic display text in --f-display-italic', (file) => {
    const source = readFileSync(path.join(process.cwd(), file), 'utf8')
    const rules = source.match(/\{[^{}]*font-style: italic[^{}]*\}/g) ?? []
    expect(rules.length).toBeGreaterThan(0)
    for (const rule of rules) expect(rule).toContain('font-family: var(--f-display-italic)')
  })

  it('is imported after globals.css in the root layout', () => {
    const globals = layout.indexOf("import '@/styles/globals.css'")
    const tokens = layout.indexOf("import '@/styles/tokens.css'")
    expect(globals).toBeGreaterThan(-1)
    expect(tokens).toBeGreaterThan(globals)
  })
})
