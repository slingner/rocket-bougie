'use client'

import { useEffect } from 'react'
import { useCart } from '@/lib/cart'

// Clears the client-side cart after a successful checkout.
// Waits for isReady so that localStorage is loaded before we clear it.
// Renders nothing. Drop this anywhere on the confirmation page.
export default function ClearCart() {
  const { clearCart, isReady } = useCart()

  useEffect(() => {
    if (!isReady) return
    clearCart()
  }, [isReady])

  return null
}
