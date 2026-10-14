import { PREVIEW_COOKIE, isPreviewCookieValue, isPreviewEnabled, previewParamAction } from './preview'

const PREVIEW = { SITE_PREVIEW_KEY: 'k3y', VERCEL_ENV: 'preview' }
const PRODUCTION = { SITE_PREVIEW_KEY: 'k3y', VERCEL_ENV: 'production' }

describe('preview', () => {
  it('uses its own cookie, not the old seal cookie', () => {
    expect(PREVIEW_COOKIE).toBe('drop_preview')
  })

  it('is enabled with a key outside Vercel production', () => {
    expect(isPreviewEnabled(PREVIEW)).toBe(true)
    expect(isPreviewEnabled({ SITE_PREVIEW_KEY: 'k3y' })).toBe(true)
    expect(isPreviewEnabled(PRODUCTION)).toBe(false)
    expect(isPreviewEnabled({ SITE_PREVIEW_KEY: '' })).toBe(false)
    expect(isPreviewEnabled({})).toBe(false)
  })

  it('accepts only a cookie that carries the key', () => {
    expect(isPreviewCookieValue('k3y', PREVIEW)).toBe(true)
    expect(isPreviewCookieValue('1', PREVIEW)).toBe(false)
    expect(isPreviewCookieValue(undefined, PREVIEW)).toBe(false)
    expect(isPreviewCookieValue('k3y', PRODUCTION)).toBe(false)
  })

  it('maps the ?preview= parameter to an action', () => {
    expect(previewParamAction('off', PREVIEW)).toBe('clear')
    expect(previewParamAction('k3y', PREVIEW)).toBe('set')
    expect(previewParamAction('guess', PREVIEW)).toBe('ignore')
    expect(previewParamAction('k3y', PRODUCTION)).toBe('ignore')
  })
})
