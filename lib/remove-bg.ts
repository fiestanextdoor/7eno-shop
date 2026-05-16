export async function removeBackground(imageUrl: string): Promise<string | null> {
  const apiKey = process.env.REMOVE_BG_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_url: imageUrl, size: 'auto' }),
      next: { revalidate: 86400 }, // cache 24 uur
    })

    if (!res.ok) return null

    const buffer = await res.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    return `data:image/png;base64,${base64}`
  } catch {
    return null
  }
}
