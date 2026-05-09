import Image from 'next/image'
import styles from './Logo.module.css'

type Variant = 'wit' | 'zwart'

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
}

export function LogoBadge({ variant = 'wit', size = 64, priority = false }: BadgeProps) {
  return (
    <div className={styles.wrap} style={{ width: size, height: size }}>
      <Image
        src={`/logos/beeldmerk-${variant}.png`}
        alt=""
        fill
        style={{ objectFit: 'contain' }}
        priority={priority}
      />
    </div>
  )
}

export function LogoWordmark({ variant = 'wit', height = 36, priority = false }: WordmarkProps) {
  // Woordmerk aspect ratio is approximately 3.5:1 (width:height)
  const width = Math.round(height * WORDMARK_ASPECT_RATIO)
  return (
    <div className={styles.wrap} style={{ width, height }}>
      <Image
        src={`/logos/woordmerk-${variant}.png`}
        alt="7ENO"
        fill
        style={{ objectFit: 'contain', objectPosition: 'left center' }}
        priority={priority}
      />
    </div>
  )
}

export default function Logo({ variant = 'wit', height = 32 }: WordmarkProps) {
  return <LogoWordmark variant={variant} height={height} />
}
