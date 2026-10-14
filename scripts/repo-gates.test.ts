/** @jest-environment node */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const SKIP_DIRS = new Set(['node_modules', 'docs', 'public', 'coverage', 'playwright-report', 'test-results'])
const SKIP_PATHS = new Set(['app/_fonts', 'AGENTS.md', 'CLAUDE.md', 'package-lock.json'])
const TEXT = /\.(ts|tsx|js|mjs|cjs|css|json|md|sql|txt|xml|yml|yaml)$|^\.env\.example$/
const SELF = 'scripts/repo-gates.test.ts'

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name)
    const rel = path.relative(ROOT, full)
    if (SKIP_PATHS.has(rel)) continue
    if (statSync(full).isDirectory()) {
      if (!name.startsWith('.') && !SKIP_DIRS.has(name)) walk(full, out)
    } else if (TEXT.test(name)) {
      out.push(rel)
    }
  }
  return out
}

function hits(files: string[], pattern: RegExp): string[] {
  return files.flatMap((file) =>
    readFileSync(path.join(ROOT, file), 'utf8')
      .split('\n')
      .flatMap((line, i) => (pattern.test(line) ? [`${file}:${i + 1}: ${line.trim()}`] : [])),
  )
}

const files = walk(ROOT)

// Every v1 token from the old styles/globals.css, the v1 theme classes and fonts.
const LEGACY =
  /--(ink|bone|butter|paper|oxblood|stone|mid|rule|gutter|font-sans|font-display|font-serif|font-mono|nav-height|max-width)(?![\w-])|\boly-(theme|palette|clay|teal|wheat|rosa|bg)\b|Cormorant|Space[ _]Mono/
const LONG_DASH = /[\u2013\u2014]/

describe('repo gates', () => {
  it('scans the source tree', () => {
    expect(files).toEqual(expect.arrayContaining(['app/layout.tsx', 'styles/tokens.css', '.env.example']))
    expect(files.some((f) => f.startsWith('docs/') || f.startsWith('node_modules/'))).toBe(false)
  })

  it('has no v1 tokens, theme classes or fonts left (spec section 10, phase 5)', () => {
    expect(hits(files.filter((f) => f !== SELF), LEGACY)).toEqual([])
  })

  it('has no em or en dashes anywhere in the source', () => {
    expect(hits(files, LONG_DASH)).toEqual([])
  })
})
