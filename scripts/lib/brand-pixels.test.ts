/** @jest-environment node */
import { alphaBounds, brightestPixel, hexToRgb, knockout, recolour } from './brand-pixels.mjs'

const NAVY = [45, 58, 79]
const PERIWINKLE = [155, 170, 201]
const CREAM = [247, 241, 218]

describe('hexToRgb', () => {
  it('parses with and without the hash', () => {
    expect(hexToRgb('#2D3A4F')).toEqual([45, 58, 79])
    expect(hexToRgb('f7f1da')).toEqual([247, 241, 218])
  })

  it('rejects anything that is not six hex digits', () => {
    expect(() => hexToRgb('#2D3A4')).toThrow('Not a hex colour: #2D3A4')
  })
})

describe('brightestPixel', () => {
  it('finds the logo colour on a dark tile', () => {
    const rgb = Buffer.from([...NAVY, ...PERIWINKLE, ...NAVY])
    expect(brightestPixel(rgb, 3)).toEqual(PERIWINKLE)
  })
})

describe('knockout', () => {
  it('makes the tile transparent and the logo opaque in the target colour', () => {
    const rgb = Buffer.from([...NAVY, ...PERIWINKLE])
    expect([...knockout(rgb, 3, NAVY, PERIWINKLE, CREAM)]).toEqual([...CREAM, 0, ...CREAM, 255])
  })

  it('keeps an anti-aliased edge half transparent', () => {
    const edge = Buffer.from(NAVY.map((c, i) => Math.round((c + PERIWINKLE[i]) / 2)))
    const alpha = knockout(edge, 3, NAVY, PERIWINKLE, CREAM)[3]
    expect(alpha).toBeGreaterThanOrEqual(124)
    expect(alpha).toBeLessThanOrEqual(132)
  })

  it('clamps colours beyond either end of the line', () => {
    const rgb = Buffer.from([0, 0, 0, 255, 255, 255])
    const out = knockout(rgb, 3, NAVY, PERIWINKLE, CREAM)
    expect(out[3]).toBe(0)
    expect(out[7]).toBe(255)
  })

  it('reads RGBA input by skipping the alpha byte', () => {
    const rgba = Buffer.from([...PERIWINKLE, 17])
    expect([...knockout(rgba, 4, NAVY, PERIWINKLE, CREAM)]).toEqual([...CREAM, 255])
  })
})

describe('recolour', () => {
  it('sets every pixel to the target and keeps its alpha', () => {
    const rgba = Buffer.from([17, 17, 17, 255, 255, 255, 255, 0, 10, 10, 10, 90])
    expect([...recolour(rgba, NAVY)]).toEqual([...NAVY, 255, ...NAVY, 0, ...NAVY, 90])
  })
})

describe('alphaBounds', () => {
  it('returns the box around the visible pixels', () => {
    // 4x3 image, visible pixels at (1,0) and (2,2)
    const rgba = Buffer.alloc(4 * 3 * 4)
    rgba[(0 * 4 + 1) * 4 + 3] = 255
    rgba[(2 * 4 + 2) * 4 + 3] = 200
    expect(alphaBounds(rgba, 4, 3)).toEqual({ left: 1, top: 0, width: 2, height: 3 })
  })

  it('ignores faint noise under the threshold', () => {
    const rgba = Buffer.alloc(2 * 1 * 4)
    rgba[3] = 5
    rgba[7] = 255
    expect(alphaBounds(rgba, 2, 1)).toEqual({ left: 1, top: 0, width: 1, height: 1 })
  })

  it('refuses a fully transparent image', () => {
    expect(() => alphaBounds(Buffer.alloc(16), 2, 2)).toThrow('Image is fully transparent')
  })
})
