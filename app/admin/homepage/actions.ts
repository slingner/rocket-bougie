'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import type { SeasonalBanner } from '@/lib/seasonal'

type BannerInput = Omit<SeasonalBanner, 'id' | 'created_at' | 'updated_at'> & { id?: string }

export async function saveBanner(data: BannerInput): Promise<SeasonalBanner> {
  const supabase = createAdminClient()
  const { id, ...fields } = data
  const record = { ...fields, updated_at: new Date().toISOString() }

  let saved
  if (id) {
    const { data: r, error } = await supabase.from('seasonal_banners').update(record).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    saved = r
  } else {
    const { data: r, error } = await supabase.from('seasonal_banners').insert(record).select().single()
    if (error) throw new Error(error.message)
    saved = r
  }

  revalidatePath('/')
  return saved as SeasonalBanner
}

export async function deleteBanner(id: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('seasonal_banners').delete().eq('id', id)
  revalidatePath('/')
}
