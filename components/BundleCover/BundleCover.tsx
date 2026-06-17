import Image from 'next/image'
import styles from './BundleCover.module.css'

interface BundleCoverProps {
  /** One resolved image per product in the set (already background-removed). */
  images: (string | null)[]
  /** Product names, used for per-cell alt text. */
  names: string[]
}

/**
 * A single composite cover for a deal: the product photos of the set shown
 * together in one frame on the brand background, so the set reads as one image.
 */
export default function BundleCover({ images, names }: BundleCoverProps) {
  return (
    <div className={styles.cover}>
      {images.map((src, i) => (
        <div key={i} className={styles.cell}>
          {src && (
            <Image
              src={src}
              alt={names[i] ?? ''}
              fill
              className={styles.img}
              sizes="(max-width: 640px) 50vw, 25vw"
            />
          )}
        </div>
      ))}
    </div>
  )
}
