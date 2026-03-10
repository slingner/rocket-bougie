import { createAdminClient } from '@/lib/supabase/server'

export type SeasonalBanner = {
  id: string
  name: string
  start_month: number
  start_day: number
  end_month: number
  end_day: number
  priority: number
  hero_image_url: string | null
  hero_headline: string | null
  hero_subtext: string | null
  hero_cta_label: string | null
  hero_cta_url: string | null
  feature_headline: string | null
  feature_subtext: string | null
  feature_image_url: string | null
  feature_cta_label: string | null
  feature_cta_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function getActiveBanner(): Promise<SeasonalBanner | null> {
  const supabase = createAdminClient()
  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()

  const { data } = await supabase
    .from('seasonal_banners')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false })

  if (!data?.length) return null

  for (const banner of data as SeasonalBanner[]) {
    if (isInRange(month, day, banner.start_month, banner.start_day, banner.end_month, banner.end_day)) {
      return banner
    }
  }

  return null
}

// Checks if month/day falls within a range, handling year-wrap (e.g. Dec 27 – Jan 10)
function isInRange(
  month: number, day: number,
  sm: number, sd: number,
  em: number, ed: number
): boolean {
  const current = month * 100 + day
  const start = sm * 100 + sd
  const end = em * 100 + ed

  if (start <= end) {
    return current >= start && current <= end
  } else {
    // Wraps around new year
    return current >= start || current <= end
  }
}
