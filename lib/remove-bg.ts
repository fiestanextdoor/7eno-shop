import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const REMOVE_BG_URL = 'https://api.remove.bg/v1.0/removebg'
const BUCKET = 'product-images'
const FOLDER = 'remove-bg'

// A processed image is either full resolution (paid credit) or preview
// resolution (free monthly API call, ~0.25 megapixel). Previews are cached
// under a separate `.preview.png` name so they can be regenerated in full
// resolution later: buy credits, delete the `*.preview.png` files in the
// Supabase Storage bucket, and the next render re-processes them full-res.
interface RemoveBgResult {
  buffer: ArrayBuffer
  preview: boolean
}

function storageClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function urlHash(imageUrl: string): string {
  return createHash('md5').update(imageUrl).digest('hex')
}

async function existsInStorage(url: string | undefined): Promise<boolean> {
  if (!url) return false
  try {
    const check = await fetch(url, { method: 'HEAD' })
    return check.ok
  } catch {
    return false
  }
}

export async function removeBackground(imageUrl: string): Promise<string | null> {
  const apiKey = process.env.REMOVE_BG_API_KEY
  if (!apiKey) return null

  const supabase = storageClient()
  const hash = urlHash(imageUrl)
  const fullFilename = `${FOLDER}/${hash}.png`
  const previewFilename = `${FOLDER}/${hash}.preview.png`

  // 1. Check Supabase Storage: full resolution first, then a cached preview.
  const fullUrl = supabase.storage.from(BUCKET).getPublicUrl(fullFilename).data?.publicUrl
  if (await existsInStorage(fullUrl)) return fullUrl!

  const previewUrl = supabase.storage.from(BUCKET).getPublicUrl(previewFilename).data?.publicUrl
  if (await existsInStorage(previewUrl)) return previewUrl!

  // 2. Call remove.bg API
  const result = await callRemoveBg(imageUrl, apiKey)
  if (!result) return null

  // 3. Ensure bucket exists, then upload
  await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {
    // bucket already exists, ignore error
  })

  const filename = result.preview ? previewFilename : fullFilename
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filename, result.buffer, { contentType: 'image/png', upsert: true })

  if (uploadError) {
    console.warn('[remove.bg] Upload to Supabase Storage failed:', uploadError.message)
    return `data:image/png;base64,${Buffer.from(result.buffer).toString('base64')}`
  }

  const { data: finalUrl } = supabase.storage.from(BUCKET).getPublicUrl(filename)
  return finalUrl?.publicUrl ?? null
}

// remove.bg sets x-credits-charged: 0 when a request was served as a free
// (preview-resolution) API call. Used to pick the right cache filename.
function wasFreeCall(res: Response): boolean {
  return res.headers.get('x-credits-charged') === '0'
}

async function callRemoveBg(imageUrl: string, apiKey: string): Promise<RemoveBgResult | null> {
  const attempt = (size: 'auto' | 'preview') =>
    fetch(REMOVE_BG_URL, {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl, size }),
    })

  // Try image_url first (fastest, no download needed)
  try {
    let res = await attempt('auto')

    // Out of paid credits: retry as an explicit preview request, which is
    // served from the 50 free API calls per month.
    if (res.status === 402) {
      console.warn('[remove.bg] Credits exhausted, retrying as free preview call')
      res = await attempt('preview')
      if (res.status === 402) {
        console.warn('[remove.bg] Free monthly API calls also exhausted, visit remove.bg/profile to top up')
        return null
      }
      if (res.ok) return { buffer: await res.arrayBuffer(), preview: true }
    }

    if (res.ok) return { buffer: await res.arrayBuffer(), preview: wasFreeCall(res) }

    const errBody = await res.text().catch(() => '')
    console.warn(`[remove.bg] image_url failed (${res.status}) for ${imageUrl}: ${errBody}`)

    if (res.status === 400 || res.status === 422) {
      return await callRemoveBgViaDownload(imageUrl, apiKey)
    }

    return null
  } catch (err) {
    console.warn('[remove.bg] Exception (image_url):', err)
    return null
  }
}

async function callRemoveBgViaDownload(imageUrl: string, apiKey: string): Promise<RemoveBgResult | null> {
  try {
    const imgRes = await fetch(imageUrl)
    if (!imgRes.ok) {
      console.warn(`[remove.bg] Could not download source image: ${imageUrl} (${imgRes.status})`)
      return null
    }

    const imgBase64 = Buffer.from(await imgRes.arrayBuffer()).toString('base64')

    const attempt = (size: 'auto' | 'preview') =>
      fetch(REMOVE_BG_URL, {
        method: 'POST',
        headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_file_b64: imgBase64, size }),
      })

    let res = await attempt('auto')
    if (res.status === 402) {
      res = await attempt('preview')
      if (res.ok) return { buffer: await res.arrayBuffer(), preview: true }
    }

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      console.warn(`[remove.bg] base64 fallback failed (${res.status}): ${errBody}`)
      return null
    }

    return { buffer: await res.arrayBuffer(), preview: wasFreeCall(res) }
  } catch (err) {
    console.warn('[remove.bg] Exception (base64 fallback):', err)
    return null
  }
}
