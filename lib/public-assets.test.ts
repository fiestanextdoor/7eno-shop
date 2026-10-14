/** @jest-environment node */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const SOURCE_DIRS = ['app', 'components', 'lib', 'hooks', 'styles']
const ASSET = /['"`(]\/((?:brand|olympian|drops|logos|categories|products)\/[A-Za-z0-9._\/-]+\.(?:png|jpe?g|webp|svg|mp4))/g

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(tsx?|css|json)$/.test(name) && !name.endsWith('.test.ts') && !name.endsWith('.test.tsx')) out.push(full)
  }
  return out
}

describe('public assets', () => {
  const refs = SOURCE_DIRS.flatMap((dir) => walk(path.join(ROOT, dir))).flatMap((file) =>
    [...readFileSync(file, 'utf8').matchAll(ASSET)].map((m) => ({ file: path.relative(ROOT, file), asset: m[1] })),
  )

  it('finds the asset references it is meant to guard', () => {
    expect(refs.some((r) => r.asset.startsWith('brand/'))).toBe(true)
  })

  it('points every referenced public path at a file that exists', () => {
    const missing = refs.filter((r) => !existsSync(path.join(ROOT, 'public', r.asset)))
    expect(missing).toEqual([])
  })

  it('has nothing left in public/logos, the v1 logo folder', () => {
    expect(refs.filter((r) => r.asset.startsWith('logos/'))).toEqual([])
    expect(existsSync(path.join(ROOT, 'public/logos'))).toBe(false)
  })
})
