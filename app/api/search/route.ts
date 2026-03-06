import { searchProducts } from '@/lib/search'
import { type NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  const results = await searchProducts(q)
  return Response.json(results)
}
