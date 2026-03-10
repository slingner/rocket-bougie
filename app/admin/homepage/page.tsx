import { createAdminClient } from '@/lib/supabase/server'
import type { SeasonalBanner } from '@/lib/seasonal'
import BannerManager from './BannerManager'

export const metadata = { title: 'Homepage Banners | Admin' }

export default async function HomepageBannersPage() {
  const supabase = createAdminClient()

  const [{ data: banners }, { data: settings }] = await Promise.all([
    supabase.from('seasonal_banners').select('*').order('start_month').order('start_day'),
    supabase.from('homepage_settings').select('seasonal_banners_enabled').single(),
  ])

  return (
    <BannerManager
      initialBanners={(banners ?? []) as SeasonalBanner[]}
      initialEnabled={settings?.seasonal_banners_enabled ?? true}
    />
  )
}
