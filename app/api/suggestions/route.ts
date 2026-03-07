import { getSuggestions } from '@/lib/search'

export async function GET() {
  return Response.json(await getSuggestions())
}
