import { ImageResponse } from 'next/og'

// Default social preview for every page that doesn't set its own image
// (product pages pass their own photo). Rendered at build/request time as PNG,
// so no webfont is fetched and the CSP is untouched.
export const alt = '7ENO (Zeno) — official streetwear store by Abra Entertainment'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1b140d 0%, #297d95 100%)',
          color: '#F7EED6',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 172,
            fontWeight: 700,
            letterSpacing: -6,
            lineHeight: 1,
            display: 'flex',
          }}
        >
          7ENO
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 38,
            letterSpacing: 10,
            textTransform: 'uppercase',
            color: '#eddca2',
            display: 'flex',
          }}
        >
          pronounced &ldquo;Zeno&rdquo;
        </div>
        <div
          style={{
            marginTop: 34,
            fontSize: 30,
            color: 'rgba(247,238,214,0.85)',
            display: 'flex',
          }}
        >
          Premium streetwear · OG &amp; Olympian collections
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 46,
            display: 'flex',
            gap: 14,
          }}
        >
          {['#b57446', '#297d95', '#eddca2', '#eda5b2'].map((hex) => (
            <div key={hex} style={{ width: 74, height: 8, background: hex, display: 'flex' }} />
          ))}
        </div>
      </div>
    ),
    size,
  )
}
