export interface DiscountRule {
  id: string
  name: string
  description: string | null
  active: boolean
  applies_to_tag: string | null
  type: 'bundle_price' | 'nth_free' | 'percent_off'
  bundle_qty: number | null
  bundle_price: number | null
  buy_qty: number | null
  get_qty: number | null
  percent_off: number | null
  sort_order: number
}

export interface CartItemForDiscount {
  tags: string[]
  price: number
  quantity: number
}

export interface RuleDiscount {
  ruleId: string
  name: string
  discountAmount: number  // dollars, always positive
}

export interface DealNudge {
  ruleId: string
  message: string
  itemsNeeded: number
}

// Expand cart items into individual price units for clean group math
function expandUnits(items: CartItemForDiscount[], tag: string | null): number[] {
  const units: number[] = []
  for (const item of items) {
    const matches = tag ? item.tags.includes(tag) : true
    if (matches) {
      for (let i = 0; i < item.quantity; i++) units.push(item.price)
    }
  }
  return units.sort((a, b) => a - b)  // cheapest first
}

function tagToLabel(tag: string | null): string {
  if (!tag) return 'item'
  return tag.replace(/-/g, ' ')
}

export function calculateRuleDiscounts(
  items: CartItemForDiscount[],
  rules: DiscountRule[]
): RuleDiscount[] {
  const results: RuleDiscount[] = []

  for (const rule of rules) {
    const units = expandUnits(items, rule.applies_to_tag)
    let discountAmount = 0

    if (rule.type === 'bundle_price' && rule.bundle_qty && rule.bundle_price !== null) {
      const bundles = Math.floor(units.length / rule.bundle_qty)
      for (let b = 0; b < bundles; b++) {
        const groupTotal = units
          .slice(b * rule.bundle_qty, (b + 1) * rule.bundle_qty)
          .reduce((sum, p) => sum + p, 0)
        discountAmount += Math.max(0, groupTotal - rule.bundle_price)
      }
    } else if (rule.type === 'nth_free' && rule.buy_qty && rule.get_qty) {
      const groupSize = rule.buy_qty + rule.get_qty
      const groups = Math.floor(units.length / groupSize)
      for (let g = 0; g < groups; g++) {
        // Within each group, cheapest get_qty items are free
        const group = units.slice(g * groupSize, (g + 1) * groupSize).sort((a, b) => a - b)
        discountAmount += group.slice(0, rule.get_qty).reduce((sum, p) => sum + p, 0)
      }
    } else if (rule.type === 'percent_off' && rule.percent_off) {
      const eligibleTotal = units.reduce((sum, p) => sum + p, 0)
      discountAmount = Math.round(eligibleTotal * rule.percent_off) / 100
    }

    if (discountAmount > 0) {
      results.push({
        ruleId: rule.id,
        name: rule.name,
        discountAmount: Math.round(discountAmount * 100) / 100,
      })
    }
  }

  return results
}

// Nudge: shown when a customer is 1–3 items away from unlocking a deal
export function calculateDealNudges(
  items: CartItemForDiscount[],
  rules: DiscountRule[]
): DealNudge[] {
  const nudges: DealNudge[] = []

  for (const rule of rules) {
    const count = items
      .filter(item => rule.applies_to_tag ? item.tags.includes(rule.applies_to_tag) : true)
      .reduce((sum, item) => sum + item.quantity, 0)

    if (count === 0) continue  // nothing in cart, don't nudge

    const label = tagToLabel(rule.applies_to_tag)

    if (rule.type === 'bundle_price' && rule.bundle_qty && rule.bundle_price !== null) {
      const remaining = count % rule.bundle_qty
      if (remaining === 0) continue  // deal already firing
      const needed = rule.bundle_qty - remaining
      if (needed > 3) continue
      nudges.push({
        ruleId: rule.id,
        message: `Add ${needed} more ${label}${needed > 1 ? 's' : ''} for ${rule.name}`,
        itemsNeeded: needed,
      })
    } else if (rule.type === 'nth_free' && rule.buy_qty && rule.get_qty) {
      const groupSize = rule.buy_qty + rule.get_qty
      const remaining = count % groupSize
      if (remaining === 0) continue  // deal already firing
      const needed = groupSize - remaining
      if (needed > 3) continue
      const freeLabel = rule.get_qty === 1 ? 'get 1 free' : `get ${rule.get_qty} free`
      nudges.push({
        ruleId: rule.id,
        message: `Add ${needed} more ${label}${needed > 1 ? 's' : ''} — ${freeLabel}`,
        itemsNeeded: needed,
      })
    }
  }

  return nudges
}
