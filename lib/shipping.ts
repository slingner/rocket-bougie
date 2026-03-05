export type ShippingProfile = {
  id: string
  name: string
  base_price: number
  additional_price: number
}

export type CartItemForShipping = {
  quantity: number
  profile: ShippingProfile | null
}

// Fallback when a variant has no profile assigned yet
const FALLBACK: ShippingProfile = {
  id: 'fallback',
  name: 'Standard',
  base_price: 2.50,
  additional_price: 0.50,
}

/**
 * Calculate total shipping for a mixed cart.
 *
 * Algorithm:
 * - Expand items into individual units
 * - Sort by base_price descending (largest envelope first)
 * - First unit: charge that profile's base_price
 * - Each additional unit: charge that unit's own additional_price
 *
 * This reflects real shipping: everything ships in the largest envelope
 * needed, and each extra item adds a small marginal cost.
 */
export function calculateShipping(items: CartItemForShipping[]): number {
  const units: ShippingProfile[] = []

  for (const item of items) {
    const profile = item.profile ?? FALLBACK
    for (let i = 0; i < item.quantity; i++) {
      units.push(profile)
    }
  }

  if (units.length === 0) return 0

  // Largest-envelope profile goes first
  units.sort((a, b) => b.base_price - a.base_price)

  let total = units[0].base_price
  for (let i = 1; i < units.length; i++) {
    total += units[i].additional_price
  }

  return Math.round(total * 100) / 100
}
