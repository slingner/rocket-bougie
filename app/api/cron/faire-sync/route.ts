import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listFaireProducts } from '@/lib/faire'

export const maxDuration = 60

export async function GET(request: Request) {
  // Verify this is being called by Vercel Cron (or a trusted source)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createAdminClient()

    // Fetch all Faire products in 2–3 paginated API calls
    const faireProducts = await listFaireProducts()
    const faireImageIds = new Set(faireProducts.flatMap(p => p.images.map(i => i.id)))

    // Find our tracked images whose Faire ID is no longer on Faire
    const { data: trackedImages } = await supabase
      .from('product_images')
      .select('id, faire_image_id')
      .eq('synced_to_faire', true)
      .not('faire_image_id', 'is', null)

    const toReset = (trackedImages ?? []).filter(
      img => !faireImageIds.has(img.faire_image_id!)
    )

    if (toReset.length > 0) {
      await supabase
        .from('product_images')
        .update({ synced_to_faire: false, faire_image_id: null })
        .in('id', toReset.map(img => img.id))
    }

    console.log(`[Faire cron] Checked ${faireImageIds.size} Faire images. Reset ${toReset.length} images as unsynced.`)

    return NextResponse.json({
      ok: true,
      faireProducts: faireProducts.length,
      faireImages: faireImageIds.size,
      reset: toReset.length,
    })
  } catch (err) {
    console.error('[Faire cron] Error:', err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
