import Image from 'next/image'
import styles from './BundleCover.module.css'

interface BundleCoverProps {
  /** One resolved image per product in the set (already background-removed). */
  images: (string | null)[]
  /** Product names, used for per-cell alt text. */
  names: string[]
  /** Override the cover ground. Defaults to the brand oxblood (see CSS); the
   *  homepage deals band passes a neutral so it matches the carousel tiles. */
  background?: string
}

/**
 * A single composite cover for a deal: the product photos of the set shown
 * together in one frame on the brand background, so the set reads as one image.
 */
export default function BundleCover({ images, names, background }: BundleCoverProps) {
  return (
    <div className={styles.cover} style={background ? { background } : undefined}>
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
