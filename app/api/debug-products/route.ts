import { getProducts } from '@/lib/printful'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const products = await getProducts()
  return NextResponse.json(
    products.map((p) => ({ id: p.id, name: p.name, synced: p.synced }))
  )
}
