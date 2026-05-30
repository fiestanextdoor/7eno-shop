import Image from 'next/image'
import styles from './Logo.module.css'

type Variant = 'wit' | 'zwart' | 'butter' | 'ink' | 'blood' | 'stone'

const WORDMARK_ASPECT_RATIO = 3.5

interface BadgeProps {
  variant?: Variant
  size?: number
  priority?: boolean
}

interface WordmarkProps {
  variant?: Variant
  height?: number
  priority?: boolean
  align?: 'left' | 'center'
}

export function LogoBadge({ variant = 'wit', size = 64, priority = false }: BadgeProps) {
  return (
    <div className={styles.wrap} style={{ width: size, height: size }}>
      <Image
        src={`/logos/beeldmerk-${variant}.png`}
        alt=""
        width={size}
        height={size}
        style={{ objectFit: 'contain' }}
        priority={priority}
      />
    </div>
  )
}

export function LogoWordmark({ variant = 'wit', height = 36, priority = false, align = 'left' }: WordmarkProps) {
  const width = Math.round(height * WORDMARK_ASPECT_RATIO)
  // Size by width + aspect-ratio with max-width:100% so the wordmark can never
  // overflow its container: on a narrow cell it shrinks proportionally (height
  // follows the ratio) instead of spilling over neighbouring layout. This keeps
  // the logo consistent across all device widths.
  return (
    <div
      className={styles.wrap}
      style={{ width, maxWidth: '100%', aspectRatio: String(WORDMARK_ASPECT_RATIO) }}
    >
      <Image
        src={`/logos/woordmerk-${variant}.png`}
        alt="7ENO"
        fill
        sizes={`${width}px`}
        style={{ objectFit: 'contain', objectPosition: align === 'center' ? 'center' : 'left center' }}
        priority={priority}
      />
    </div>
  )
}

export default function Logo({ variant = 'wit', height = 32 }: WordmarkProps) {
  return <LogoWordmark variant={variant} height={height} />
}
