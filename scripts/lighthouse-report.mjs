// Runs Lighthouse (mobile preset) against a production build on home, PLP and
// PDP and writes docs/qa/lighthouse-<date>.md. Run `npm run build` first, then
// `npm run qa:lighthouse`. Starts and stops `next start` itself.
import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { chromium } from '@playwright/test'
import { meetsTarget, pickPdpPath, renderReport, summarise, warmUp } from './lib/lighthouse-report.mjs'

const ROOT = process.cwd()
const PORT = Number(process.env.LH_PORT ?? 3100)
const BASE = `http://localhost:${PORT}`
const BIN = (name) => path.join(ROOT, 'node_modules/.bin', name)

function run(cmd, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', env })
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${path.basename(cmd)} exited with ${code}`))))
  })
}

async function waitForServer(url, timeoutMs = 60_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`No server at ${url} after ${timeoutMs} ms`)
}

const server = spawn(BIN('next'), ['start', '-p', String(PORT)], { stdio: 'inherit' })
try {
  await waitForServer(BASE)
  const pdp = pickPdpPath(await (await fetch(`${BASE}/sitemap.xml`)).text())
  const pages = [
    { name: 'Home', path: '/' },
    { name: 'PLP', path: '/shop' },
    { name: 'PDP', path: pdp },
  ]
  const warm = await warmUp(BASE, pages.filter((p) => p.path).map((p) => p.path))
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'lighthouse-'))
  const env = { ...process.env, CHROME_PATH: process.env.CHROME_PATH ?? chromium.executablePath() }
  const rows = []
  for (const page of pages) {
    if (!page.path) {
      rows.push({ ...page, summary: null })
      continue
    }
    const out = path.join(tmp, `${page.name}.json`)
    await run(BIN('lighthouse'), [
      new URL(page.path, BASE).href,
      '--output=json',
      `--output-path=${out}`,
      '--only-categories=performance,accessibility,best-practices,seo',
      '--chrome-flags=--headless=new --no-sandbox',
      '--quiet',
    ], env)
    rows.push({ ...page, summary: summarise(JSON.parse(await readFile(out, 'utf8'))) })
  }
  const lighthouseVersion = JSON.parse(await readFile(path.join(ROOT, 'node_modules/lighthouse/package.json'), 'utf8')).version
  const date = new Date().toISOString().slice(0, 10)
  const file = path.join(ROOT, 'docs/qa', `lighthouse-${date}.md`)
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, renderReport({ date, base: BASE, rows, warm, lighthouseVersion }))
  console.log(`Wrote ${path.relative(ROOT, file)}`)
  if (rows.some((row) => row.summary && !meetsTarget(row.summary))) process.exitCode = 1
} finally {
  server.kill('SIGTERM')
}
