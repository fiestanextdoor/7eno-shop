/** @jest-environment node */
import path from 'node:path'
import sharp from 'sharp'
import manifest from './manifest'

describe('web app manifest', () => {
  const m = manifest()

  it('uses the official cream and navy', () => {
    expect(m.background_color).toBe('#F7F1DA')
    expect(m.theme_color).toBe('#2D3A4F')
    expect(m.description).toContain('Olympian and OLYMPN Sport')
  })

  it('declares a 192 and a 512 icon plus a maskable one, never sizes "any" on a PNG', () => {
    expect(m.icons?.map((i) => [i.sizes, i.purpose])).toEqual([
      ['192x192', 'any'], ['512x512', 'any'], ['512x512', 'maskable'],
    ])
  })

  it('declares sizes that match the real pixels', async () => {
    for (const icon of m.icons ?? []) {
      const meta = await sharp(path.join(process.cwd(), 'public', icon.src)).metadata()
      expect(`${meta.width}x${meta.height}`).toBe(icon.sizes)
      expect(icon.type).toBe('image/png')
    }
  })
})
