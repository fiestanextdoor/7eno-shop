import Image from 'next/image'
import styles from './Logo.module.css'

type Variant = 'wit' | 'zwart'

interface BadgeProps {
  variant?: Variant
  size?: number
}

interface WordmarkProps {
  variant?: Variant
  height?: number
}

export function LogoBadge({ variant = 'wit', size = 64 }: BadgeProps) {
  return (
    <div className={styles.wrap} style={{ width: size, height: size }}>
      <Image
        src={`/logos/beeldmerk-${variant}.png`}
        alt=""
        fill
        style={{ objectFit: 'contain' }}
        priority
      />
    </div>
  )
}

export function LogoWordmark({ variant = 'wit', height = 36 }: WordmarkProps) {
  // Woordmerk aspect ratio is approximately 3.5:1 (width:height)
  const width = Math.round(height * 3.5)
  return (
    <div className={styles.wrap} style={{ width, height }}>
      <Image
        src={`/logos/woordmerk-${variant}.png`}
        alt="7ENO"
        fill
        style={{ objectFit: 'contain', objectPosition: 'left center' }}
        priority
      />
    </div>
  )
}

export default function Logo({ variant = 'wit' as Variant, height = 32 }: WordmarkProps) {
  return <LogoWordmark variant={variant} height={height} />
}
