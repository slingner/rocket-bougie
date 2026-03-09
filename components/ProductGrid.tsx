'use client'

import { useEffect, useRef, useState } from 'react'
import ProductCard from '@/components/ProductCard'
import type { CardVariant } from '@/components/AddToCartButton'

type Product = {
  id: string
  handle: string
  title: string
  price: number
  imageUrl: string | null
  imageAlt: string | null
  productId: string
  variants: CardVariant[]
  tags: string[]
}

type FilterParams = {
  collectionTags?: string[]
  typeTags?: string[]
  cardCategory?: string
}

export default function ProductGrid({
  initialProducts,
  totalCount,
  filterParams,
  columns = 'four',
  children,
}: {
  initialProducts: Product[]
  totalCount: number
  filterParams: FilterParams
  columns?: 'three' | 'four'
  children?: React.ReactNode
}) {
  const [products, setProducts]   = useState(initialProducts)
  const [loading, setLoading]     = useState(false)
  const pageRef                   = useRef(1)
  const loadingRef                = useRef(false)
  const sentinelRef               = useRef<HTMLDivElement>(null)
  const hasMore                   = products.length < totalCount

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry.isIntersecting || loadingRef.current) return
      loadingRef.current = true
      setLoading(true)

      const params = new URLSearchParams({ page: String(pageRef.current + 1) })
      if (filterParams.collectionTags?.length) params.set('collectionTags', filterParams.collectionTags.join(','))
      if (filterParams.typeTags?.length)       params.set('typeTags',       filterParams.typeTags.join(','))
      if (filterParams.cardCategory)           params.set('cardCategory',   filterParams.cardCategory)

      try {
        const res  = await fetch(`/api/products?${params}`)
        const data = await res.json()
        setProducts(prev => [...prev, ...data.products])
        pageRef.current += 1
      } finally {
        loadingRef.current = false
        setLoading(false)
      }
    }, { rootMargin: '600px' })

    observer.observe(el)
    return () => observer.disconnect()
  }, [filterParams])  // stable — parent uses key prop to remount on filter change

  const gridClass = columns === 'three'
    ? 'grid grid-cols-2 sm:grid-cols-3 gap-6'
    : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6'

  return (
    <>
      <div className={gridClass}>
        {products.map((p, i) => (
          <ProductCard key={p.id} {...p} priority={i < 8} />
        ))}
      </div>

      {/* Sentinel — IntersectionObserver watches this */}
      {hasMore && <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />}

      {/* Loading indicator */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '2.5rem 0', opacity: 0.35, fontSize: '0.8rem', letterSpacing: '0.06em' }}>
          Loading…
        </div>
      )}

      {/* Children render when all products are loaded (e.g. promo cards) */}
      {!hasMore && children}
    </>
  )
}
