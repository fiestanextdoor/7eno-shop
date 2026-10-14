import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { BEELDMERK, BRAND_COLOURS } from '@/lib/brand'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

// Favicon: the cream 7ENO mark on navy. Rendered once at build time. PNG until
// Joep delivers the SVG exports (spec section 8 and 10).
export default function Icon() {
  const mark = readFileSync(join(process.cwd(), 'public', BEELDMERK.cream.src))
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: BRAND_COLOURS.navy,
        }}
      >
        <img
          src={`data:image/png;base64,${mark.toString('base64')}`}
          alt=""
          style={{ width: '70%', height: '70%', objectFit: 'contain' }}
        />
      </div>
    ),
    { ...size }
  )
}
