import { INSTAGRAM_FALLBACK, type SocialPost } from '@/lib/social'

/** How many posts the home band shows. */
export const POST_COUNT = 4

interface GraphMedia {
  id: string
  caption?: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url?: string
  thumbnail_url?: string
  permalink: string
}

/** One Graph API item as the band shows it; null when it has no picture. */
export function toSocialPost(m: GraphMedia): SocialPost | null {
  const image = m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url
  if (!image) return null
  const caption = (m.caption ?? '').replace(/\s+/g, ' ').trim()
  return {
    id: m.id,
    permalink: m.permalink,
    image,
    alt: caption ? caption.slice(0, 120) : 'Instagram post by 7ENO',
    kind: m.media_type === 'VIDEO' ? 'video' : 'image',
  }
}

/**
 * The newest posts of the brand account via the Instagram API (Instagram
 * login, scope instagram_business_basic), cached for an hour. Without a
 * token, or when Instagram fails, the saved fallback posts are shown so the
 * band never comes up empty.
 */
export async function getInstagramPosts(): Promise<SocialPost[]> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN
  if (!token) return INSTAGRAM_FALLBACK.slice(0, POST_COUNT)
  try {
    const url = new URL('https://graph.instagram.com/me/media')
    url.searchParams.set('fields', 'id,caption,media_type,media_url,thumbnail_url,permalink')
    url.searchParams.set('limit', String(POST_COUNT * 2))
    url.searchParams.set('access_token', token)
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) throw new Error(`Instagram ${res.status}`)
    const json = (await res.json()) as { data?: GraphMedia[] }
    const posts = (json.data ?? []).map(toSocialPost).filter((p): p is SocialPost => p !== null).slice(0, POST_COUNT)
    return posts.length > 0 ? posts : INSTAGRAM_FALLBACK.slice(0, POST_COUNT)
  } catch (err) {
    console.error('[Instagram] feed failed, showing the saved posts:', err)
    return INSTAGRAM_FALLBACK.slice(0, POST_COUNT)
  }
}
