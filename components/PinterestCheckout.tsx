'use client'

import { useEffect } from 'react'
import { pinterestTrack } from '@/lib/pinterest'

interface Props {
  // Stripe checkout session ID. The webhook sends the same ID to the Conversions API,
  // so Pinterest counts the order once even though it hears about it twice.
  eventId: string
  value: number
  currency: string
  orderQuantity: number
}

// Reports a completed purchase to the Pinterest Tag. Renders nothing.
export default function PinterestCheckout({ eventId, value, currency, orderQuantity }: Props) {
  useEffect(() => {
    pinterestTrack('checkout', {
      event_id: eventId,
      value,
      currency,
      order_quantity: orderQuantity,
      order_id: eventId,
    })
  }, [eventId, value, currency, orderQuantity])

  return null
}
