/** @jest-environment node */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const CODE = ['app', 'components', 'hooks', 'lib', 'store', 'scripts', 'proxy.ts', 'next.config.ts']
// Set by the platform or by the QA scripts themselves, never by a person.
const PLATFORM = new Set(['NODE_ENV', 'VERCEL_ENV', 'NEXT_RUNTIME', 'CI', 'CHROME_PATH', 'LH_PORT', 'E2E_PORT'])

function files(entry: string, out: string[] = []): string[] {
  const full = path.join(ROOT, entry)
  if (statSync(full).isDirectory()) {
    for (const name of readdirSync(full)) files(path.join(entry, name), out)
  } else if (/\.(ts|tsx|mjs)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
    out.push(full)
  }
  return out
}

const example = readFileSync(path.join(ROOT, '.env.example'), 'utf8')
const declared = new Set([...example.matchAll(/^([A-Z][A-Z0-9_]+)=/gm)].map((m) => m[1]))
const used = new Set(
  CODE.flatMap((entry) => files(entry)).flatMap((file) =>
    [...readFileSync(file, 'utf8').matchAll(/process\.env\.([A-Z][A-Z0-9_]+)/g)].map((m) => m[1]),
  ),
)

describe('.env.example', () => {
  it('declares every variable the code reads', () => {
    expect([...used].filter((name) => !PLATFORM.has(name) && !declared.has(name)).sort()).toEqual([])
  })

  it('declares the v2 variables from spec section 7', () => {
    for (const name of ['RESEND_WAITLIST_AUDIENCE_ID', 'SITE_PREVIEW_KEY', 'PRINTFUL_ACCOUNT_TOKEN', 'PRINTFUL_STORE_ID']) {
      expect(declared.has(name)).toBe(true)
    }
  })

  it('never contains a real secret', () => {
    expect(example).not.toMatch(/sk_live_|rk_live_|whsec_[A-Za-z0-9]{12,}|re_[A-Za-z0-9]{20,}/)
  })
})
