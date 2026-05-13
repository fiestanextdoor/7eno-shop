import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

export default function Icon() {
  const logoBuffer = readFileSync(join(process.cwd(), 'public/logos/beeldmerk-wit.png'))
  const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          background: '#5C1A1B',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoBase64}
          alt=""
          style={{ width: '76%', height: '76%', objectFit: 'contain' }}
        />
      </div>
    ),
    { ...size }
  )
}
