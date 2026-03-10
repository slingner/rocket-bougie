'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'

export async function saveBanner(formData: FormData) {
  const supabase = createAdminClient()
  const id = formData.get('id') as string | null

  const str = (key: string) => (formData.get(key) as string) || null
  const num = (key: string) => parseInt(formData.get(key) as string) || 0

  const data = {
    name: formData.get('name') as string,
    start_month: num('start_month'),
    start_day: num('start_day'),
    end_month: num('end_month'),
    end_day: num('end_day'),
    priority: num('priority'),
    is_active: formData.get('is_active') === 'on',
    hero_image_url: str('hero_image_url'),
    hero_headline: str('hero_headline'),
    hero_subtext: str('hero_subtext'),
    hero_cta_label: str('hero_cta_label'),
    hero_cta_url: str('hero_cta_url'),
    feature_headline: str('feature_headline'),
    feature_subtext: str('feature_subtext'),
    feature_image_url: str('feature_image_url'),
    feature_cta_label: str('feature_cta_label'),
    feature_cta_url: str('feature_cta_url'),
    updated_at: new Date().toISOString(),
  }

  if (id && id !== 'new') {
    await supabase.from('seasonal_banners').update(data).eq('id', id)
  } else {
    await supabase.from('seasonal_banners').insert(data)
  }

  revalidatePath('/')
  redirect('/admin/homepage')
}

export async function deleteBanner(id: string) {
  const supabase = createAdminClient()
  await supabase.from('seasonal_banners').delete().eq('id', id)
  revalidatePath('/')
  revalidatePath('/admin/homepage')
}
