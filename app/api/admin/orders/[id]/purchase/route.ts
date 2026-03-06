import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { purchaseLabel } from '@/lib/shippo'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) return null
  return createAdminClient()
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminClient = await requireAdmin()
  if (!adminClient) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const rateId: string = body.rateId

  if (!rateId) return Response.json({ error: 'rateId required' }, { status: 400 })

  try {
    const transaction = await purchaseLabel(rateId)

    if (transaction.status !== 'SUCCESS') {
      const msg = transaction.messages?.map(m => m.text).join(', ') || 'Label purchase failed'
      return Response.json({ error: msg }, { status: 400 })
    }

    const supabase = await adminClient

    // Save tracking + label URL to order (don't auto-mark fulfilled — let admin do that)
    await supabase
      .from('orders')
      .update({
        tracking_number: transaction.tracking_number,
        tracking_url: transaction.tracking_url_provider,
        label_url: transaction.label_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    return Response.json({
      trackingNumber: transaction.tracking_number,
      trackingUrl: transaction.tracking_url_provider,
      labelUrl: transaction.label_url,
    })
  } catch (err) {
    console.error('Shippo purchase error:', err)
    return Response.json({ error: err instanceof Error ? err.message : 'Purchase failed' }, { status: 500 })
  }
}
