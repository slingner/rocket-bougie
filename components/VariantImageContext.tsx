'use client'

import { createContext, useContext, useState } from 'react'

type Ctx = { jumpToId: string | null; setJumpToId: (id: string | null) => void }
const VariantImageContext = createContext<Ctx>({ jumpToId: null, setJumpToId: () => {} })

export function VariantImageProvider({ children }: { children: React.ReactNode }) {
  const [jumpToId, setJumpToId] = useState<string | null>(null)
  return (
    <VariantImageContext.Provider value={{ jumpToId, setJumpToId }}>
      {children}
    </VariantImageContext.Provider>
  )
}

export const useVariantImage = () => useContext(VariantImageContext)
