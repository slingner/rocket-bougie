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

interface CartContextValue {
  items: CartItem[]
  isReady: boolean          // true after localStorage has been loaded
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  clearCart: () => void
  itemCount: number
  subtotal: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isReady, setIsReady] = useState(false)

  // Load from localStorage on first render (client only)
  useEffect(() => {
    const stored = localStorage.getItem('rb-cart')
    if (stored) {
      try {
        setItems(JSON.parse(stored))
      } catch {
        // Malformed data — just start fresh
      }
    }
    setIsReady(true)
  }, [])

  // Persist to localStorage whenever items change (skip before first load)
  useEffect(() => {
    if (isReady) {
      localStorage.setItem('rb-cart', JSON.stringify(items))
    }
  }, [items, isReady])

  function addItem(newItem: Omit<CartItem, 'quantity'>) {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === newItem.variantId)
      if (existing) {
        // Already in cart — bump the quantity
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
  }

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

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
