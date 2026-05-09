import styles from './WaveBars.module.css'

const HEIGHTS = [8, 16, 10, 22, 14, 18, 6, 20, 12, 18, 8, 14]

interface WaveBarsProps {
  color?: string
  scale?: number
}

export default function WaveBars({ color = 'currentColor', scale = 1 }: WaveBarsProps) {
  return (
    <div className={styles.wrap} style={{ color }} aria-hidden="true">
      {HEIGHTS.map((h, i) => (
        <div
          key={i}
          className={styles.bar}
          style={{ height: h * scale }}
        />
      ))}
    </div>
  )
}
