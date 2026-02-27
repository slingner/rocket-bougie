'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export interface CartItem {
  variantId: string
  productId: string
  handle: string
  title: string
  variantTitle: string | null  // e.g. "8x10", or null for single-variant products
  price: number
  imageUrl: string | null
  quantity: number
}

export interface AppliedDiscount {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  stripePromotionCodeId: string
}

interface CartContextValue {
  items: CartItem[]
  isReady: boolean          // true after localStorage has been loaded
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  clearCart: () => void
  itemCount: number
  subtotal: number
  appliedDiscount: AppliedDiscount | null
  discountAmount: number
  applyDiscount: (discount: AppliedDiscount) => void
  removeDiscount: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isReady, setIsReady] = useState(false)
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null)

  // Load from localStorage on first render (client only)
  useEffect(() => {
    const stored = localStorage.getItem('rb-cart')
    if (stored) {
      try { setItems(JSON.parse(stored)) } catch { /* malformed — start fresh */ }
    }
    const storedDiscount = localStorage.getItem('rb-cart-discount')
    if (storedDiscount) {
      try { setAppliedDiscount(JSON.parse(storedDiscount)) } catch {}
    }
    setIsReady(true)
  }, [])

  // Persist items to localStorage whenever they change (skip before first load)
  useEffect(() => {
    if (isReady) {
      localStorage.setItem('rb-cart', JSON.stringify(items))
    }
  }, [items, isReady])

  // Persist discount to localStorage
  useEffect(() => {
    if (!isReady) return
    if (appliedDiscount) {
      localStorage.setItem('rb-cart-discount', JSON.stringify(appliedDiscount))
    } else {
      localStorage.removeItem('rb-cart-discount')
    }
  }, [appliedDiscount, isReady])

  function addItem(newItem: Omit<CartItem, 'quantity'>) {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === newItem.variantId)
      if (existing) {
        return prev.map((i) =>
          i.variantId === newItem.variantId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { ...newItem, quantity: 1 }]
    })
  }

  function removeItem(variantId: string) {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId))
  }

  function updateQuantity(variantId: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(variantId)
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.variantId === variantId ? { ...i, quantity } : i))
    )
  }

  function clearCart() {
    setItems([])
    setAppliedDiscount(null)
  }

  function applyDiscount(discount: AppliedDiscount) {
    setAppliedDiscount(discount)
  }

  function removeDiscount() {
    setAppliedDiscount(null)
  }

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  // Recompute discount amount from current subtotal so it stays accurate if cart changes
  const discountAmount = appliedDiscount
    ? appliedDiscount.type === 'percentage'
      ? Math.round(subtotal * appliedDiscount.value) / 100
      : Math.min(subtotal, appliedDiscount.value)
    : 0

  return (
    <CartContext.Provider
      value={{
        items,
        isReady,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        appliedDiscount,
        discountAmount,
        applyDiscount,
        removeDiscount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
