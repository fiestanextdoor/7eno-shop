import Image from 'next/image'
import { BEELDMERK, WORDMARK, widthAt, type BrandTone } from '@/lib/brand'
import styles from './Logo.module.css'

/** v1 colour names, accepted until the last v1 caller is gone (phase 5). */
type LegacyVariant = 'wit' | 'zwart' | 'butter' | 'ink' | 'blood' | 'stone'
export type LogoVariant = BrandTone | LegacyVariant

/** Light variants sit on navy surfaces, everything else on cream. */
export function toneFor(variant: LogoVariant): BrandTone {
  return variant === 'cream' || variant === 'wit' || variant === 'butter' ? 'cream' : 'navy'
}

interface BadgeProps {
  variant?: LogoVariant
  size?: number
  priority?: boolean
}

interface WordmarkProps {
  variant?: LogoVariant
  height?: number
  priority?: boolean
  align?: 'left' | 'center'
}

function eager(priority: boolean) {
  return priority ? ({ loading: 'eager', fetchPriority: 'high' } as const) : {}
}

export function LogoBadge({ variant = 'navy', size = 64, priority = false }: BadgeProps) {
  const mark = BEELDMERK[toneFor(variant)]
  return (
    <div className={styles.wrap} style={{ width: size, height: size }}>
      <Image
        src={mark.src}
        alt=""
        width={size}
        height={size}
        style={{ objectFit: 'contain', width: '100%', height: '100%' }}
        {...eager(priority)}
      />
    </div>
  )
}

export function LogoWordmark({ variant = 'navy', height = 36, priority = false, align = 'left' }: WordmarkProps) {
  const mark = WORDMARK[toneFor(variant)]
  const width = widthAt(mark, height)
  // Explicit width and height reserve the box before the file loads. The
  // fixed height with an automatic width keeps the natural ratio; on a narrow
  // cell max-width caps the box and object-fit keeps the mark undistorted.
  return (
    <div
      className={styles.wrap}
      style={{
        maxWidth: '100%',
        width: align === 'center' ? 'fit-content' : undefined,
        marginInline: align === 'center' ? 'auto' : undefined,
      }}
    >
      <Image
        src={mark.src}
        alt="7ENO"
        width={width}
        height={height}
        style={{
          display: 'block',
          width: 'auto',
          height,
          maxWidth: '100%',
          objectFit: 'contain',
          objectPosition: align === 'center' ? 'center' : 'left center',
        }}
        {...eager(priority)}
      />
    </div>
  )
}

export default function Logo({ variant = 'navy', height = 32 }: WordmarkProps) {
  return <LogoWordmark variant={variant} height={height} />
}
