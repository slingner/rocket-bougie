import { createAdminClient } from '@/lib/supabase/server'
import type { SeasonalBanner } from '@/lib/seasonal'
import BannerManager from './BannerManager'

export const metadata = { title: 'Homepage Banners | Admin' }

export default async function HomepageBannersPage() {
  const supabase = createAdminClient()
  const { data: banners } = await supabase
    .from('seasonal_banners')
    .select('*')
    .order('priority', { ascending: false })

  return <BannerManager initialBanners={(banners ?? []) as SeasonalBanner[]} />
}
