import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const REMOVE_BG_URL = 'https://api.remove.bg/v1.0/removebg'
const BUCKET = 'product-images'
const FOLDER = 'remove-bg'

function storageClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function urlHash(imageUrl: string): string {
  return createHash('md5').update(imageUrl).digest('hex')
}

export async function removeBackground(imageUrl: string): Promise<string | null> {
  const apiKey = process.env.REMOVE_BG_API_KEY
  if (!apiKey) return null

  const supabase = storageClient()
  const filename = `${FOLDER}/${urlHash(imageUrl)}.png`

  // 1. Check Supabase Storage — if already processed, return immediately
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filename)
  const publicUrl = urlData?.publicUrl
  if (publicUrl) {
    try {
      const check = await fetch(publicUrl, { method: 'HEAD' })
      if (check.ok) return publicUrl
    } catch {}
  }

  // 2. Call remove.bg API
  const pngBuffer = await callRemoveBg(imageUrl, apiKey)
  if (!pngBuffer) return null

  // 3. Ensure bucket exists, then upload
  await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {
    // bucket already exists — ignore error
  })

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filename, pngBuffer, { contentType: 'image/png', upsert: true })

  if (uploadError) {
    console.warn('[remove.bg] Upload to Supabase Storage failed:', uploadError.message)
    return `data:image/png;base64,${Buffer.from(pngBuffer).toString('base64')}`
  }

  const { data: finalUrl } = supabase.storage.from(BUCKET).getPublicUrl(filename)
  return finalUrl?.publicUrl ?? null
}

async function callRemoveBg(imageUrl: string, apiKey: string): Promise<ArrayBuffer | null> {
  // Try image_url first (fastest, no download needed)
  try {
    const res = await fetch(REMOVE_BG_URL, {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl, size: 'auto' }),
    })

    if (res.ok) return await res.arrayBuffer()

    const errBody = await res.text().catch(() => '')

    if (res.status === 402) {
      console.warn('[remove.bg] Credits exhausted — visit remove.bg/profile to top up')
      return null
    }

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

async function callRemoveBgViaDownload(imageUrl: string, apiKey: string): Promise<ArrayBuffer | null> {
  try {
    const imgRes = await fetch(imageUrl)
    if (!imgRes.ok) {
      console.warn(`[remove.bg] Could not download source image: ${imageUrl} (${imgRes.status})`)
      return null
    }

    const imgBase64 = Buffer.from(await imgRes.arrayBuffer()).toString('base64')

    const res = await fetch(REMOVE_BG_URL, {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_file_b64: imgBase64, size: 'auto' }),
    })

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      console.warn(`[remove.bg] base64 fallback failed (${res.status}): ${errBody}`)
      return null
    }

    return await res.arrayBuffer()
  } catch (err) {
    console.warn('[remove.bg] Exception (base64 fallback):', err)
    return null
  }
}
