import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return null
  }
  return createAdminClient()
}

export async function GET() {
  const adminClient = await requireAdmin()
  if (!adminClient) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await adminClient
  const { data } = await supabase
    .from('shipping_profiles')
    .select('*')
    .order('sort_order')

  return Response.json(data ?? [])
}

export async function POST(req: Request) {
  const adminClient = await requireAdmin()
  if (!adminClient) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await adminClient
  const body = await req.json()

  const { data, error } = await supabase
    .from('shipping_profiles')
    .insert({
      name: body.name,
      description: body.description ?? null,
      base_price: Number(body.base_price),
      additional_price: Number(body.additional_price),
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
