'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Nav from '@/components/Nav'
import { useCart } from '@/lib/cart'
import { validateDiscountCode } from '@/app/admin/actions'

export default function CartPage() {
  const {
    items, isReady, removeItem, updateQuantity,
    subtotal, itemCount,
    appliedDiscount, discountAmount, applyDiscount, removeDiscount,
  } = useCart()

  const [checkingOut, setCheckingOut] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)
  // First-time-only codes aren't applied to the cart — customer enters them in Stripe checkout
  const [pendingFirstTimeCode, setPendingFirstTimeCode] = useState<string | null>(null)

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return
    setCouponError(null)
    setCouponLoading(true)
    try {
      const result = await validateDiscountCode(couponInput.trim(), subtotal)
      if (!result.valid) {
        setCouponError(result.error)
      } else if (result.firstTimeOnly) {
        // Don't apply to cart — Stripe validates these properly at checkout
        setPendingFirstTimeCode(couponInput.trim().toUpperCase())
        setCouponInput('')
      } else {
        applyDiscount({
          id: result.id,
          code: couponInput.trim().toUpperCase(),
          type: result.type,
          value: result.value,
          stripePromotionCodeId: result.stripePromotionCodeId,
        })
        setCouponInput('')
      }
    } finally {
      setCouponLoading(false)
    }
  }

  function handleRemoveCoupon() {
    removeDiscount()
    setCouponError(null)
  }

  function handleRemoveFirstTimeCode() {
    setPendingFirstTimeCode(null)
  }

  async function handleCheckout() {
    setCheckingOut(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
          discountCode: appliedDiscount?.code ?? null,
          allowPromoCodes: pendingFirstTimeCode !== null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Checkout failed')

      window.location.href = data.url
    } catch (err) {
      console.error(err)
      setCheckingOut(false)
    }
  }

  // Don't render cart contents until localStorage has been read —
  // prevents a flash of empty state on page load
  if (!isReady) {
    return (
      <>
        <Nav />
        <main style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem 1.5rem' }} />
      </>
    )
  }

  const total = Math.max(0, subtotal - discountAmount)

  return (
    <>
      <Nav />
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem 1.5rem 6rem' }}>

        {/* Header */}
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            margin: '0 0 0.5rem',
          }}
        >
          Cart
        </h1>
        <p style={{ opacity: 0.45, fontSize: '0.875rem', margin: '0 0 2.5rem' }}>
          {itemCount === 0
            ? 'Nothing here yet.'
            : `${itemCount} item${itemCount !== 1 ? 's' : ''}`}
        </p>

        {/* Empty state */}
        {items.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '5rem 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.5rem',
            }}
          >
            <p style={{ opacity: 0.35, fontSize: '3rem' }}>🛒</p>
            <p style={{ opacity: 0.5, fontSize: '1rem' }}>Your cart is empty.</p>
            <Link
              href="/shop"
              style={{
                background: 'var(--accent)',
                color: 'var(--foreground)',
                padding: '0.75rem 1.75rem',
                borderRadius: '100px',
                fontSize: '0.9rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Browse the shop
            </Link>
          </div>
        )}

        {/* Items + summary */}
        {items.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
              gap: 'clamp(2rem, 5vw, 4rem)',
              alignItems: 'start',
            }}
          >
            {/* Item list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {items.map((item) => (
                <div
                  key={item.variantId}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    paddingBottom: '1.5rem',
                    borderBottom: '1px solid var(--border)',
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Image */}
                  <Link href={`/products/${item.handle}`} style={{ flexShrink: 0 }}>
                    <div
                      style={{
                        width: 88,
                        height: 88,
                        borderRadius: '0.625rem',
                        overflow: 'hidden',
                        background: 'var(--muted)',
                        position: 'relative',
                        flexShrink: 0,
                      }}
                    >
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          sizes="88px"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0.2,
                            fontSize: '1.5rem',
                          }}
                        >
                          🚀
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link
                      href={`/products/${item.handle}`}
                      style={{
                        fontWeight: 500,
                        fontSize: '0.9rem',
                        lineHeight: 1.3,
                        color: 'var(--foreground)',
                        textDecoration: 'none',
                        display: 'block',
                        marginBottom: '0.2rem',
                      }}
                    >
                      {item.title}
                    </Link>

                    {item.variantTitle && (
                      <p style={{ fontSize: '0.8rem', opacity: 0.45, margin: '0 0 0.75rem' }}>
                        {item.variantTitle}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      {/* Quantity stepper */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          border: '1px solid var(--border)',
                          borderRadius: '100px',
                          overflow: 'hidden',
                        }}
                      >
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          aria-label="Decrease quantity"
                          style={{
                            width: 34,
                            height: 34,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            color: 'var(--foreground)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          −
                        </button>
                        <span
                          style={{
                            minWidth: 28,
                            textAlign: 'center',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            userSelect: 'none',
                          }}
                        >
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          aria-label="Increase quantity"
                          style={{
                            width: 34,
                            height: 34,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            color: 'var(--foreground)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          +
                        </button>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeItem(item.variantId)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          opacity: 0.4,
                          padding: 0,
                          color: 'var(--foreground)',
                          fontFamily: 'var(--font-sans)',
                        }}
                        className="hover:opacity-70"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Line price */}
                  <p
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      flexShrink: 0,
                      margin: 0,
                    }}
                  >
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            {/* Order summary */}
            <div
              style={{
                background: 'var(--muted)',
                borderRadius: '1rem',
                padding: '1.75rem',
                position: 'sticky',
                top: '6rem',
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.4rem',
                  fontWeight: 400,
                  margin: '0 0 1.5rem',
                  letterSpacing: '-0.01em',
                }}
              >
                Order Summary
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ opacity: 0.6 }}>Subtotal</span>
                  <span style={{ fontWeight: 500 }}>${subtotal.toFixed(2)}</span>
                </div>

                {/* Discount line */}
                {appliedDiscount && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          fontFamily: 'monospace',
                          background: '#dcfce7',
                          color: '#166534',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                        }}
                      >
                        {appliedDiscount.code}
                      </span>
                      <button
                        onClick={handleRemoveCoupon}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          opacity: 0.4,
                          padding: 0,
                          color: 'var(--foreground)',
                          fontFamily: 'inherit',
                        }}
                        className="hover:opacity-70"
                      >
                        Remove
                      </button>
                    </span>
                    <span style={{ fontWeight: 500, color: '#166534' }}>
                      −${discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ opacity: 0.6 }}>Shipping</span>
                  <span style={{ opacity: 0.5, fontSize: '0.82rem' }}>Calculated at checkout</span>
                </div>
              </div>

              {/* First-time-only code — redirect to Stripe for validation */}
              {pendingFirstTimeCode && (
                <div style={{
                  margin: '1.25rem 0',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  background: '#ede9fe',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#5b21b6' }}>
                      {pendingFirstTimeCode}
                    </p>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#5b21b6', opacity: 0.8 }}>
                      New customer code — enter it at Stripe checkout to apply your discount.
                    </p>
                  </div>
                  <button
                    onClick={handleRemoveFirstTimeCode}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      color: '#5b21b6',
                      opacity: 0.5,
                      padding: 0,
                      fontFamily: 'inherit',
                      flexShrink: 0,
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Coupon input (only shown when no discount is applied) */}
              {!appliedDiscount && !pendingFirstTimeCode && (
                <div style={{ margin: '1.25rem 0', display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={couponInput}
                    onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null) }}
                    onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                    placeholder="Discount code"
                    style={{
                      flex: 1,
                      padding: '0.6rem 0.875rem',
                      borderRadius: '0.5rem',
                      border: `1px solid ${couponError ? '#991b1b' : 'var(--border)'}`,
                      background: 'var(--background)',
                      fontSize: '0.875rem',
                      color: 'var(--foreground)',
                      fontFamily: 'inherit',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    style={{
                      padding: '0.6rem 1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      background: 'var(--background)',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      cursor: couponLoading || !couponInput.trim() ? 'not-allowed' : 'pointer',
                      opacity: couponLoading || !couponInput.trim() ? 0.5 : 1,
                      color: 'var(--foreground)',
                      fontFamily: 'inherit',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {couponLoading ? '…' : 'Apply'}
                  </button>
                </div>
              )}

              {couponError && (
                <p style={{ fontSize: '0.8rem', color: '#991b1b', margin: '-0.75rem 0 1rem' }}>
                  {couponError}
                </p>
              )}

              <div
                style={{
                  borderTop: '1px solid var(--border)',
                  margin: appliedDiscount || couponError ? '0 0 0' : '1.25rem 0 0',
                  paddingTop: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Total</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
                  ${total.toFixed(2)}
                </span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '100px',
                  background: 'var(--accent)',
                  color: 'var(--foreground)',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: checkingOut ? 'wait' : 'pointer',
                  opacity: checkingOut ? 0.7 : 1,
                  letterSpacing: '0.01em',
                  fontFamily: 'var(--font-sans)',
                  transition: 'opacity 0.15s',
                  marginTop: '1.25rem',
                }}
                className={checkingOut ? '' : 'hover:opacity-80'}
              >
                {checkingOut ? 'Redirecting...' : 'Checkout'}
              </button>

              <p
                style={{
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  opacity: 0.4,
                  margin: '1rem 0 0',
                }}
              >
                Taxes and shipping calculated at checkout
              </p>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
