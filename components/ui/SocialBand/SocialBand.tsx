import Image from 'next/image'
import type { CSSProperties } from 'react'
import { buttonClasses } from '@/components/ui/Button/Button'
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, TIKTOK_HANDLE, TIKTOK_URL, type SocialPost } from '@/lib/social'
import styles from './SocialBand.module.css'

export interface SocialBandProps {
  posts: SocialPost[]
}

function InstagramGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function TikTokGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.5 3c.3 2.4 1.8 4 4.5 4.2v3.1c-1.7 0-3.2-.5-4.5-1.4v6.6a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v3.2a2.6 2.6 0 1 0 1.7 2.4V3h3.1z" />
    </svg>
  )
}

function PlayGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path d="M3 1.5v11l9-5.5z" fill="currentColor" />
    </svg>
  )
}

/** Navy band: follow buttons for Instagram and TikTok, and the newest posts. */
export default function SocialBand({ posts }: SocialBandProps) {
  return (
    <section className={styles.band} data-band="social" aria-labelledby="social-band-title">
      <div className={styles.inner}>
        <div className={styles.head} data-reveal="up">
          <p className={styles.label}>Behind the drop</p>
          <h2 id="social-band-title" className={styles.title}>Follow 7ENO</h2>
          <p className={styles.text}>
            Fits, studio days and release news first on Instagram and TikTok.
          </p>
          <div className={styles.buttons}>
            <a href={INSTAGRAM_URL} className={buttonClasses('accent', 'lg')} target="_blank" rel="noopener noreferrer">
              <InstagramGlyph />
              @{INSTAGRAM_HANDLE}
            </a>
            <a href={TIKTOK_URL} className={buttonClasses('ghost', 'lg')} target="_blank" rel="noopener noreferrer">
              <TikTokGlyph />
              @{TIKTOK_HANDLE}
            </a>
          </div>
        </div>
        {posts.length > 0 && (
          <ul className={styles.grid} data-reveal="stagger" aria-label="Latest Instagram posts">
            {posts.map((post) => (
              <li key={post.id} className={styles.cell}>
                {/* Each post in its own ratio, as in the app; the live feed (no size known) gets the 4:5 feed frame. */}
                <a
                  href={post.permalink}
                  className={styles.post}
                  style={post.width && post.height ? ({ '--post-ratio': `${post.width} / ${post.height}` } as CSSProperties) : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image src={post.image} alt={post.alt} fill sizes="(min-width: 1024px) 25vw, 50vw" className={styles.image} />
                  {post.kind === 'video' && (
                    <span className={styles.badge}>
                      <PlayGlyph />
                      Reel
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
