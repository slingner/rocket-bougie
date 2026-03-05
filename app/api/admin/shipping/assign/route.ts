import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) return null
  return createAdminClient()
}

// Assign a shipping profile to one or more variant IDs
// Body: { variantIds: string[], profileId: string | null }
export async function POST(req: Request) {
  const adminClient = await requireAdmin()
  if (!adminClient) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await adminClient
  const body = await req.json()
  const variantIds: string[] = body.variantIds
  const profileId: string | null = body.profileId ?? null

  if (!variantIds || variantIds.length === 0) {
    return Response.json({ error: 'No variant IDs provided' }, { status: 400 })
  }

  const { error } = await supabase
    .from('product_variants')
    .update({ shipping_profile_id: profileId })
    .in('id', variantIds)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true, updated: variantIds.length })
}
