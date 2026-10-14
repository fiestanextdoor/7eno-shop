/**
 * Pixel helpers for scripts/build-brand-assets.mjs. Pure functions on raw
 * buffers, so they are unit tested without sharp.
 */

/** '#2D3A4F' to [45, 58, 79]. */
export function hexToRgb(hex) {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!match) throw new Error(`Not a hex colour: ${hex}`)
  const n = parseInt(match[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** The pixel with the highest channel sum: the logo colour on a dark tile. */
export function brightestPixel(data, channels) {
  let best = -1
  let colour = [0, 0, 0]
  for (let i = 0; i < data.length; i += channels) {
    const sum = data[i] + data[i + 1] + data[i + 2]
    if (sum > best) {
      best = sum
      colour = [data[i], data[i + 1], data[i + 2]]
    }
  }
  return colour
}

/**
 * Lifts a flat two-colour logo off its tile. Every pixel is projected on the
 * line from `bg` to `fg`: the tile becomes transparent, the logo opaque, and
 * anti-aliased edges keep their partial alpha. Output is RGBA in `target`.
 */
export function knockout(data, channels, bg, fg, target) {
  const pixels = data.length / channels
  const out = Buffer.alloc(pixels * 4)
  const d = [fg[0] - bg[0], fg[1] - bg[1], fg[2] - bg[2]]
  const length2 = d[0] * d[0] + d[1] * d[1] + d[2] * d[2]
  for (let p = 0; p < pixels; p += 1) {
    const i = p * channels
    const t = ((data[i] - bg[0]) * d[0] + (data[i + 1] - bg[1]) * d[1] + (data[i + 2] - bg[2]) * d[2]) / length2
    const o = p * 4
    out[o] = target[0]
    out[o + 1] = target[1]
    out[o + 2] = target[2]
    out[o + 3] = Math.round(Math.min(1, Math.max(0, t)) * 255)
  }
  return out
}

/** Recolours an RGBA image to `target`, keeping its alpha channel. */
export function recolour(rgba, target) {
  const out = Buffer.from(rgba)
  for (let o = 0; o < out.length; o += 4) {
    out[o] = target[0]
    out[o + 1] = target[1]
    out[o + 2] = target[2]
  }
  return out
}

/** Bounding box of the pixels whose alpha exceeds `threshold` (RGBA input). */
export function alphaBounds(rgba, width, height, threshold = 8) {
  let left = width
  let top = height
  let right = -1
  let bottom = -1
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (rgba[(y * width + x) * 4 + 3] <= threshold) continue
      if (x < left) left = x
      if (x > right) right = x
      if (y < top) top = y
      if (y > bottom) bottom = y
    }
  }
  if (right < 0) throw new Error('Image is fully transparent')
  return { left, top, width: right - left + 1, height: bottom - top + 1 }
}
