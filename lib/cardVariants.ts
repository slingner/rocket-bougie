import type { CardVariant } from '@/components/AddToCartButton'

type RawVariant = {
  id: string
  price: number
  option1_name: string | null
  option1_value: string | null
  option2_value?: string | null
}

// Build the CardVariant array used by ProductCard / AddToCartButton.
// Single "Default Title" variants become a single entry with an empty label.
// Real option variants (size, etc.) get a label from their option values.
export function toCardVariants(variants: RawVariant[]): CardVariant[] {
  if (variants.length === 0) return []

  const isSingleDefault =
    variants.length === 1 && variants[0].option1_name === 'Title'

  if (isSingleDefault) {
    return [{ id: variants[0].id, price: variants[0].price, label: '' }]
  }

  const frameOrder: Record<string, number> = { Unframed: 0, Framed: 1 }

  return [...variants]
    .sort((a, b) => {
      // Sort by leading number in size (8x10 → 8, 11x14 → 11)
      const sizeA = parseInt(a.option1_value ?? '0')
      const sizeB = parseInt(b.option1_value ?? '0')
      if (sizeA !== sizeB) return sizeA - sizeB
      // Within same size: Print (Unframed) before Framed
      return (frameOrder[a.option2_value ?? ''] ?? 0) - (frameOrder[b.option2_value ?? ''] ?? 0)
    })
    .map((v) => {
      const size = v.option1_value
      const frame =
        v.option2_value === 'Unframed' ? 'Print' :
        v.option2_value === 'Framed'   ? 'Framed Print' :
        v.option2_value ?? null
      const parts = [size, frame].filter(Boolean) as string[]
      return { id: v.id, price: v.price, label: parts.join(' ') }
    })
}
