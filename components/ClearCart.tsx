'use client'

import { useEffect } from 'react'
import { useCart } from '@/lib/cart'

// Clears the client-side cart after a successful checkout.
// Renders nothing. Drop this anywhere on the confirmation page.
export default function ClearCart() {
  const { clearCart } = useCart()

  useEffect(() => {
    clearCart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
