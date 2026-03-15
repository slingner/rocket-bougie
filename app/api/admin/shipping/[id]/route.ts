import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) return null
  return createAdminClient()
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminClient = await requireAdmin()
  if (!adminClient) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = await adminClient
  const body = await req.json()

  const { data, error } = await supabase
    .from('shipping_profiles')
    .update({
      name: body.name,
      description: body.description ?? null,
      base_price: Number(body.base_price),
      additional_price: Number(body.additional_price),
      pounds: body.pounds != null ? Number(body.pounds) : null,
      length_in: body.length_in != null ? Number(body.length_in) : null,
      width_in: body.width_in != null ? Number(body.width_in) : null,
      height_in: body.height_in != null ? Number(body.height_in) : null,
      parcel_type: body.parcel_type ?? 'LGENV',
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminClient = await requireAdmin()
  if (!adminClient) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = await adminClient

  const { error } = await supabase.from('shipping_profiles').delete().eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
