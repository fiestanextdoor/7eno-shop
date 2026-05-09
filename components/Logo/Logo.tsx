interface LogoProps {
  fg?: string
  height?: number
  showKeraunos?: boolean
}

export function SevenWordmark({ fg = 'currentColor', height = 40 }: { fg?: string; height?: number }) {
  const h = height
  const unit = h / 100

  return (
    <svg
      width={290 * unit}
      height={h}
      viewBox="0 0 290 100"
      style={{ display: 'block' }}
      aria-label="7ENO"
    >
      {/* 7 */}
      <polygon points="0,2 72,2 72,20 0,20" fill={fg} />
      <polygon points="72,2 72,20 34,100 20,100" fill={fg} />
      {/* E */}
      <polygon points="78,2 138,2 138,20 78,20" fill={fg} />
      <polygon points="78,2 94,2 94,98 78,98" fill={fg} />
      <polygon points="94,42 128,42 128,58 94,58" fill={fg} />
      <polygon points="78,80 138,80 138,98 78,98" fill={fg} />
      {/* N */}
      <polygon points="144,2 160,2 160,98 144,98" fill={fg} />
      <polygon points="194,2 210,2 210,98 194,98" fill={fg} />
      <polygon points="160,2 176,2 210,76 210,98 194,98 160,28" fill={fg} />
      {/* O */}
      <path
        d="M 216,2 L 288,2 L 288,98 L 216,98 Z M 232,22 L 232,78 L 272,78 L 272,22 Z"
        fill={fg}
        fillRule="evenodd"
      />
    </svg>
  )
}

export function Keraunos({ fg = 'currentColor', width = 80 }: { fg?: string; width?: number }) {
  const h = width * 0.22
  return (
    <svg width={width} height={h} viewBox="0 0 120 26" style={{ display: 'block' }} aria-hidden="true">
      <polygon
        points="6,11 40,3 48,11 72,3 80,11 114,3 114,9 82,17 74,9 50,17 42,9 6,17"
        fill={fg}
      />
      <polygon points="6,11 0,9 0,19 6,17" fill={fg} />
      <polygon points="114,3 120,1 120,11 114,9" fill={fg} />
    </svg>
  )
}

export default function Logo({ fg = 'currentColor', height = 32, showKeraunos = false }: LogoProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
      {showKeraunos && <Keraunos fg={fg} width={height * 2} />}
      <SevenWordmark fg={fg} height={height} />
    </div>
  )
}
