// Room photos for the homepage banner. Each has an empty frame whose opening is measured
// as a fraction of the full photo; SeasonalBanner crops the photo to the banner's shape and
// works out where the opening lands in that crop, so a new photo only needs measuring once.

export interface BannerBackground {
  src: string
  width: number   // native pixel size
  height: number
  // The frame opening, as fractions (0–1) of the full photo.
  box: { left: number; top: number; width: number; height: number }
  // Which part of the photo the wide desktop banner keeps when it trims the top and
  // bottom: 0 = keep the top, 0.5 = trim evenly, 1 = keep the bottom.
  desktopFocusY?: number
  // Moves the desktop headline block up by this fraction of the banner's height, for
  // photos with decor rising into the lower right.
  copyNudgeUp?: number
  // Same photo with only the things standing in front of the frame left in (transparent
  // elsewhere). Drawn over the art so decor that overlaps the frame stays in front.
  foreground?: string
}

// Frame opening measured by script (the photo's pure-white rectangle).
export const CHRISTMAS_BACKGROUND: BannerBackground = {
  src: '/banner-christmas.webp',
  width: 1672,
  height: 941,
  box: { left: 0.1788, top: 0.0797, width: 0.2554, height: 0.6015 },
  // The frame sits close to the top edge, so trim from the bottom (just the drawers).
  desktopFocusY: 0,
  // Clears the lit ceramic houses on the console.
  copyNudgeUp: 0.08,
}

const pct = (n: number) => `${(n * 100).toFixed(2)}%`

/**
 * Where the frame opening lands once the photo is object-fit: cover'd into a box of
 * `ratio` (width / height). Desktop uses the photo's desktopFocusY; mobile centers the
 * crop on the frame so the print reads as the hero.
 */
export function bannerLayout(bg: BannerBackground, ratio: number, mobile: boolean) {
  const photoRatio = bg.width / bg.height
  let { left, top, width, height } = bg.box
  let focusX = 0.5
  const focusY = mobile ? 0.5 : bg.desktopFocusY ?? 0.5

  if (photoRatio > ratio) {
    // Photo is wider than the banner: trim the sides.
    const visible = ratio / photoRatio
    if (mobile) {
      const center = left + width / 2
      focusX = Math.min(1, Math.max(0, (center - visible / 2) / (1 - visible)))
    }
    const offset = focusX * (1 - visible)
    left = (left - offset) / visible
    width /= visible
  } else {
    // Photo is taller than the banner: trim the top and bottom.
    const visible = photoRatio / ratio
    const offset = focusY * (1 - visible)
    top = (top - offset) / visible
    height /= visible
  }

  return {
    left: pct(left), top: pct(top), width: pct(width), height: pct(height),
    position: `${pct(focusX)} ${pct(focusY)}`,
  }
}

// Champagne, confetti and string lights. Frame opening measured by script.
export const NEW_YEAR_BACKGROUND: BannerBackground = {
  src: '/banner-new-year.webp',
  width: 1672,
  height: 941,
  box: { left: 0.1872, top: 0.0691, width: 0.2458, height: 0.5600 },
  // The frame sits close to the top edge, so trim from the bottom (just floor).
  desktopFocusY: 0,
}

// Blush bedroom with red roses and a taper candle. Frame opening measured by script.
export const VALENTINES_BACKGROUND: BannerBackground = {
  src: '/banner-valentines.webp',
  width: 1672,
  height: 941,
  box: { left: 0.1699, top: 0.0701, width: 0.2578, height: 0.5898 },
  // The frame sits close to the top edge, so trim from the bottom (just the nightstand).
  desktopFocusY: 0,
}

// Sunroom with peonies and a teacup. Frame opening measured by script.
export const MOTHERS_DAY_BACKGROUND: BannerBackground = {
  src: '/banner-mothers-day.webp',
  width: 1672,
  height: 941,
  box: { left: 0.2093, top: 0.0670, width: 0.2356, height: 0.5505 },
  desktopFocusY: 0,
  // The bouquet overlaps the frame's bottom-left corner.
  foreground: '/banner-mothers-day-front.webp',
}

// Den with a record player, vinyl and a whiskey glass. Frame opening measured by script.
export const FATHERS_DAY_BACKGROUND: BannerBackground = {
  src: '/banner-fathers-day.webp',
  width: 1672,
  height: 941,
  box: { left: 0.1681, top: 0.0680, width: 0.2620, height: 0.5739 },
  desktopFocusY: 0,
}

// Pumpkins, candles and autumn branches. Frame opening measured by script.
export const HALLOWEEN_BACKGROUND: BannerBackground = {
  src: '/banner-halloween.webp',
  width: 1672,
  height: 941,
  box: { left: 0.1657, top: 0.0574, width: 0.2470, height: 0.5685 },
  desktopFocusY: 0,
}

// Winter morning: alarm clock, steaming mug, frosted pine. Frame opening measured by script.
export const GROUNDHOG_DAY_BACKGROUND: BannerBackground = {
  src: '/banner-groundhog-day.webp',
  width: 1672,
  height: 941,
  box: { left: 0.1525, top: 0.0627, width: 0.2542, height: 0.5749 },
  desktopFocusY: 0,
}

// Cherry blossom branches in a glass vase, dappled light. Frame opening measured by script.
export const SPRING_BACKGROUND: BannerBackground = {
  src: '/banner-spring.webp',
  width: 1672,
  height: 941,
  box: { left: 0.2063, top: 0.1031, width: 0.2350, height: 0.5654 },
  desktopFocusY: 0,
}

// Palm, rattan stool and a straw hat in golden light. Frame opening measured by script.
export const SUMMER_BACKGROUND: BannerBackground = {
  src: '/banner-summer.webp',
  width: 1672,
  height: 941,
  box: { left: 0.1645, top: 0.0967, width: 0.2404, height: 0.5866 },
  desktopFocusY: 0,
  // A few palm fronds cross the frame's lower-left edge.
  foreground: '/banner-summer-front.webp',
}

// Maple leaves, old books, a mug and a brass lamp. Frame opening measured by script.
export const FALL_BACKGROUND: BannerBackground = {
  src: '/banner-fall.webp',
  width: 1672,
  height: 941,
  box: { left: 0.1364, top: 0.0818, width: 0.2512, height: 0.5696 },
  desktopFocusY: 0,
}

// Snowy window, lantern, knit throw and birch logs. Frame opening measured by script.
export const WINTER_BACKGROUND: BannerBackground = {
  src: '/banner-winter.webp',
  width: 1672,
  height: 941,
  box: { left: 0.2022, top: 0.0935, width: 0.2494, height: 0.5792 },
  desktopFocusY: 0,
}

// Porch with hydrangeas, a bucket of iced sodas and a folded flag. Frame opening measured by script.
export const JULY_4_BACKGROUND: BannerBackground = {
  src: '/banner-july-4.webp',
  width: 1672,
  height: 941,
  box: { left: 0.1968, top: 0.0786, width: 0.2344, height: 0.5579 },
  desktopFocusY: 0,
  // Two bottle tops rise in front of the frame's bottom edge.
  foreground: '/banner-july-4-front.webp',
}
