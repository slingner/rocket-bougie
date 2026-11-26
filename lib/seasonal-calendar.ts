// The automatic homepage banner calendar: which holiday or season is on right now,
// which artwork it shows, and the last day to order for holiday delivery.
//
// It covers the whole year, so the homepage is always on theme without anyone having to
// remember to update it. Pure date logic, no database: the homepage looks up the products.
//
// Copied from Color In Film, with Rocket Boogie art in the frame instead of film prints.

import {
  CHRISTMAS_BACKGROUND, FALL_BACKGROUND, FATHERS_DAY_BACKGROUND, GROUNDHOG_DAY_BACKGROUND,
  HALLOWEEN_BACKGROUND, JULY_4_BACKGROUND, MOTHERS_DAY_BACKGROUND, NEW_YEAR_BACKGROUND, SPRING_BACKGROUND,
  SUMMER_BACKGROUND, VALENTINES_BACKGROUND, WINTER_BACKGROUND, type BannerBackground,
} from './banner-backgrounds'

// Worst-case turnaround from the shipping page (app/shipping/page.tsx): "a couple of extra
// days" to pack the order, then up to 7 business days in transit. Update both together.
const PROCESSING_DAYS_MAX = 2
const TRANSIT_DAYS_MAX = 7
const BUSINESS_DAYS_TO_DELIVER = PROCESSING_DAYS_MAX + TRANSIT_DAYS_MAX

// We're in San Francisco, so the banner flips at midnight Pacific rather than at
// midnight UTC (which is late afternoon the day before for shoppers).
const STORE_TIME_ZONE = 'America/Los_Angeles'

// ── Dates ───────────────────────────────────────────────────────────────────
// A "day" is a Date at midnight UTC, used purely as a calendar date.

const day = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d))
const addDays = (date: Date, n: number) => new Date(date.getTime() + n * 86_400_000)

/** The nth given weekday of a month, e.g. the 2nd Sunday of May (weekday 0 = Sunday). */
function nthWeekday(y: number, m: number, weekday: number, n: number) {
  const first = day(y, m, 1)
  return addDays(first, ((weekday - first.getUTCDay() + 7) % 7) + (n - 1) * 7)
}

/** Last day to order so it arrives the day before `date`, counting only weekdays. */
function orderByDate(date: Date) {
  let d = addDays(date, -1)
  for (let left = BUSINESS_DAYS_TO_DELIVER; left > 0; ) {
    d = addDays(d, -1)
    const weekday = d.getUTCDay()
    if (weekday !== 0 && weekday !== 6) left--
  }
  return d
}

/** Today's calendar date in the store's time zone. */
export function storeToday(now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: STORE_TIME_ZONE, year: 'numeric', month: 'numeric', day: 'numeric',
  }).formatToParts(now)
  const get = (type: string) => Number(parts.find(p => p.type === type)!.value)
  return day(get('year'), get('month'), get('day'))
}

function formatDay(date: Date) {
  return date.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' })
}

// ── The calendar ────────────────────────────────────────────────────────────

interface Season {
  key: string
  name: string
  // Holidays where people buy gifts or decorations: the banner promises delivery
  // by this date until the order-by day passes.
  deliverBy?: { label: string; date: (y: number) => Date }
  // When the banner shows for season-year `y`. It may start in the previous calendar
  // year (winter, New Year). `cutoff` is the order-by day when there is one.
  window: (y: number, cutoff: Date | null) => { start: Date; end: Date }
  // Holidays beat seasons; higher wins when windows overlap.
  priority: number
  // One headline per year, in turn.
  headlines: string[]
  // Product IDs to show in the frame, best first. Hidden or deleted products are skipped.
  // Left empty (or none left), the banner shows a few art prints instead.
  art: string[]
  // Room photo behind the art.
  background: BannerBackground
}

// The art picks are the products chosen for each holiday in the seasonal_banners seed
// (supabase/migrations/20260309000000_seasonal_banners.sql). Seasons with no pick yet
// show a few art prints for now.
const SEASONS: Season[] = [
  // ── Holidays ──
  {
    key: 'christmas',
    name: 'Christmas',
    deliverBy: { label: 'Christmas', date: y => day(y, 12, 25) },
    // Right after Halloween through the order-by day; winter takes over after that.
    window: (y, cutoff) => ({ start: day(y, 11, 1), end: cutoff! }),
    priority: 2,
    headlines: ['The gift of something handmade.', 'Wrapped up in joy.', 'Handpainted, ready to gift.'],
    art: ['1b401340-b91a-4556-b8e5-b2efe74f812c'],
    background: CHRISTMAS_BACKGROUND,
  },
  {
    key: 'new-year',
    name: "New Year's",
    window: y => ({ start: day(y - 1, 12, 26), end: day(y, 1, 9) }),
    priority: 2,
    headlines: ['Fresh year, fresh walls.', "Here's to a colorful year ahead.", 'Ring it in with color.'],
    art: ['d043f6b5-2e6d-456b-a73b-7030621c40e1'],
    background: NEW_YEAR_BACKGROUND,
  },
  {
    key: 'valentines',
    name: "Valentine's Day",
    deliverBy: { label: "Valentine's Day", date: y => day(y, 2, 14) },
    window: (y, cutoff) => ({ start: day(y, 1, 10), end: cutoff! }),
    priority: 2,
    headlines: ['Love is in the details.', 'Made with love, for the ones you love.', 'Say it with watercolor.'],
    art: ['0ed6cf99-9dac-4ba0-817e-7fe79f30b25b'],
    background: VALENTINES_BACKGROUND,
  },
  {
    key: 'groundhog-day',
    name: 'Groundhog Day',
    window: y => ({ start: day(y, 1, 31), end: day(y, 2, 2) }),
    priority: 3,
    headlines: ['Six more weeks of art.', 'Peek out at something new.', 'Same day, new art.'],
    art: [],
    background: GROUNDHOG_DAY_BACKGROUND,
  },
  {
    key: 'mothers-day',
    name: "Mother's Day",
    deliverBy: { label: "Mother's Day", date: y => nthWeekday(y, 5, 0, 2) },
    window: (y, cutoff) => ({ start: addDays(nthWeekday(y, 5, 0, 2), -35), end: cutoff! }),
    priority: 2,
    headlines: ['For the mom who deserves something handmade.', "She'll love something made by hand.", 'Handpainted, for mom.'],
    art: ['640ae1dc-a5e8-4460-89a7-610ab6375b63'],
    background: MOTHERS_DAY_BACKGROUND,
  },
  {
    key: 'fathers-day',
    name: "Father's Day",
    deliverBy: { label: "Father's Day", date: y => nthWeekday(y, 6, 0, 3) },
    window: (y, cutoff) => ({ start: addDays(nthWeekday(y, 6, 0, 3), -35), end: cutoff! }),
    priority: 2,
    headlines: ['Something handmade for Dad.', 'For the dad who has everything (except this).', 'Hang one up for Dad.'],
    art: [],
    background: FATHERS_DAY_BACKGROUND,
  },
  {
    key: 'july-4',
    name: 'Fourth of July',
    window: y => ({ start: day(y, 6, 26), end: day(y, 7, 4) }),
    priority: 2,
    headlines: ['Red, white, and handpainted.', 'Fireworks, in watercolor.', 'Summer cookout, sticker edition.'],
    art: [],
    background: JULY_4_BACKGROUND,
  },
  {
    key: 'halloween',
    name: 'Halloween',
    // People decorate for it, so delivery matters — but the theme runs all of October.
    deliverBy: { label: 'Halloween', date: y => day(y, 10, 31) },
    window: y => ({ start: day(y, 9, 22), end: day(y, 10, 31) }),
    priority: 2,
    headlines: ['A little spooky. A lot cute.', 'Boo — from our studio to yours.', 'Trick or treat yourself.'],
    art: ['e6e4caaa-c0b4-4344-9fe5-4727983a7c25'],
    background: HALLOWEEN_BACKGROUND,
  },

  // ── Seasons (cover the whole year, so there's always something on theme) ──
  {
    key: 'winter',
    name: 'Winter',
    window: y => ({ start: day(y - 1, 12, 1), end: addDays(day(y, 3, 1), -1) }),
    priority: 1,
    headlines: ['Cozy art for cold days.', 'Warm colors for winter walls.', 'Snowed in with something new.'],
    art: [],
    background: WINTER_BACKGROUND,
  },
  {
    key: 'spring',
    name: 'Spring',
    window: y => ({ start: day(y, 3, 1), end: day(y, 5, 31) }),
    priority: 1,
    headlines: ['Fresh starts and new colors.', 'The world is waking up.', 'Everything in bloom.'],
    art: ['94bec10d-da55-46cb-9dae-148fc8814589'],
    background: SPRING_BACKGROUND,
  },
  {
    key: 'summer',
    name: 'Summer',
    window: y => ({ start: day(y, 6, 1), end: day(y, 8, 31) }),
    priority: 1,
    headlines: ['Sun, sea, and a whole lot of color.', 'Golden hour, every hour.', 'Summer in a sticker.'],
    art: ['79c60e08-f3c4-47e0-9028-01ee1832eecc'],
    background: SUMMER_BACKGROUND,
  },
  {
    key: 'fall',
    name: 'Fall',
    window: y => ({ start: day(y, 9, 1), end: day(y, 11, 30) }),
    priority: 1,
    // The art is the seed's Thanksgiving pick.
    headlines: ['Thankful for the little things.', 'Sweater weather art.', 'Fall into color.'],
    art: ['94f5297e-3c55-4c5c-834a-9d676920c959'],
    background: FALL_BACKGROUND,
  },
]

// ── Picking ─────────────────────────────────────────────────────────────────

export interface ActiveSeason {
  season: Season
  year: number           // the season's year (winter 2027 starts Dec 2026)
  orderBy: Date | null   // last day to order for holiday delivery, while it's still ahead
}

/** The holiday or season showing on `today` (a storeToday() date). */
export function activeSeason(today: Date): ActiveSeason | null {
  const y = today.getUTCFullYear()
  let best: ActiveSeason | null = null
  for (const season of SEASONS) {
    // Next year's occurrence covers windows that start in December (winter, New Year).
    for (const year of [y, y + 1]) {
      const cutoff = season.deliverBy ? orderByDate(season.deliverBy.date(year)) : null
      const { start, end } = season.window(year, cutoff)
      if (today < start || today > end) continue
      if (best && best.season.priority >= season.priority) continue
      best = { season, year, orderBy: cutoff && today <= cutoff ? cutoff : null }
    }
  }
  return best
}

export function headlineForYear(active: ActiveSeason) {
  const { headlines } = active.season
  return headlines[active.year % headlines.length]
}

export function deliverySubhead(active: ActiveSeason) {
  if (!active.orderBy || !active.season.deliverBy) return null
  return `Order by ${formatDay(active.orderBy)} for delivery by ${active.season.deliverBy.label}.`
}
