// Pinterest Tag (browser-side conversion tracking).
// The tag ID is public: Pinterest's own snippet puts it in every page's HTML.
// Safe to call from any client component; the tag script loads itself on first use,
// so the order in which components fire events doesn't matter.

export const PINTEREST_TAG_ID = '2612684174498'

type Pintrk = ((...args: unknown[]) => void) & { queue?: unknown[][]; version?: string }

declare global {
  interface Window {
    pintrk?: Pintrk
  }
}

function getPintrk(): Pintrk {
  if (!window.pintrk) {
    // Same setup as Pinterest's base code: queue calls until core.js loads and takes over
    const pintrk: Pintrk = (...args) => {
      pintrk.queue!.push(args)
    }
    pintrk.queue = []
    pintrk.version = '3.0'
    window.pintrk = pintrk

    const script = document.createElement('script')
    script.async = true
    script.src = 'https://s.pinimg.com/ct/core.js'
    document.head.appendChild(script)

    pintrk('load', PINTEREST_TAG_ID)
  }
  return window.pintrk
}

export function pinterestPageVisit() {
  getPintrk()('page')
}

export function pinterestTrack(event: 'addtocart' | 'checkout', data: Record<string, unknown>) {
  getPintrk()('track', event, data)
}
