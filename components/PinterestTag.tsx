'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { pinterestPageVisit } from '@/lib/pinterest'

// Loads the Pinterest Tag and records a page visit on every page change.
// Next.js navigates without full page reloads, so we watch the path instead of
// relying on a single page call at load time.
export default function PinterestTag() {
  const pathname = usePathname()

  useEffect(() => {
    pinterestPageVisit()
  }, [pathname])

  return null
}
