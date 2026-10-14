/** @jest-environment node */
import { cookies } from 'next/headers'
import { isPreviewSession } from './preview-session'

jest.mock('next/headers', () => ({ cookies: jest.fn() }))

const ORIGINAL_ENV = { ...process.env }

function withCookie(value: string | undefined) {
  jest.mocked(cookies).mockResolvedValue({
    get: (name: string) => (name === 'drop_preview' && value !== undefined ? { name, value } : undefined),
  } as unknown as Awaited<ReturnType<typeof cookies>>)
}

beforeEach(() => {
  jest.mocked(cookies).mockReset()
  process.env = { ...ORIGINAL_ENV, SITE_PREVIEW_KEY: 'k3y', VERCEL_ENV: 'preview' }
})

afterAll(() => {
  process.env = ORIGINAL_ENV
})

describe('isPreviewSession', () => {
  it('never reads cookies when preview is off, so pages stay static', async () => {
    delete process.env.SITE_PREVIEW_KEY
    await expect(isPreviewSession()).resolves.toBe(false)
    expect(cookies).not.toHaveBeenCalled()
  })

  it('is true for the cookie that carries the key', async () => {
    withCookie('k3y')
    await expect(isPreviewSession()).resolves.toBe(true)
  })

  it('is false for a hand-made cookie', async () => {
    withCookie('1')
    await expect(isPreviewSession()).resolves.toBe(false)
  })

  it('is false on Vercel production even with the right cookie', async () => {
    process.env.VERCEL_ENV = 'production'
    withCookie('k3y')
    await expect(isPreviewSession()).resolves.toBe(false)
    expect(cookies).not.toHaveBeenCalled()
  })
})
