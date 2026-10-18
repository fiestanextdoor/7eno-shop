/** Brand profiles and the Instagram posts the home page falls back to. */

export const INSTAGRAM_HANDLE = '7enobyabraent'
export const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`
export const TIKTOK_HANDLE = '7enobyabraentertainment'
export const TIKTOK_URL = `https://www.tiktok.com/@${TIKTOK_HANDLE}`

export interface SocialPost {
  id: string
  /** Full Instagram URL of the post or reel. */
  permalink: string
  /** Square thumbnail; local under /social or an Instagram CDN URL. */
  image: string
  alt: string
  kind: 'image' | 'video'
  /** Pixel size of the image, so the band can show the post in its own ratio; unknown for the live feed. */
  width?: number
  height?: number
}

/**
 * The newest four posts on 18-10-2026, saved under public/social at their
 * original size and ratio so the band always renders. lib/instagram replaces them with the live feed when an
 * INSTAGRAM_ACCESS_TOKEN is configured.
 */
export const INSTAGRAM_FALLBACK: SocialPost[] = [
  { id: 'Deoopofum8C', permalink: 'https://www.instagram.com/7enobyabraent/reel/Deoopofum8C/', image: '/social/instagram-1.jpg', alt: 'Reel by 7ENO, 18 October 2026', kind: 'video', width: 640, height: 758 },
  { id: 'DeUjCg8OpKp', permalink: 'https://www.instagram.com/7enobyabraent/p/DeUjCg8OpKp/', image: '/social/instagram-2.jpg', alt: 'Post by 7ENO, 10 October 2026', kind: 'image', width: 640, height: 640 },
  { id: 'DbL2RtfuIkP', permalink: 'https://www.instagram.com/7enobyabraent/p/DbL2RtfuIkP/', image: '/social/instagram-3.jpg', alt: 'Post by 7ENO, 24 July 2026', kind: 'image', width: 1080, height: 1000 },
  { id: 'DaqBPpssw44', permalink: 'https://www.instagram.com/7enobyabraent/p/DaqBPpssw44/', image: '/social/instagram-4.jpg', alt: 'Post by 7ENO, 22 July 2026', kind: 'image', width: 1131, height: 1508 },
]
