'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Nav from '@/components/Nav'
import { useCart } from '@/lib/cart'
import { validateDiscountCode, getActiveDiscountRules } from '@/app/admin/actions'
import { calculateRuleDiscounts, calculateDealNudges } from '@/lib/discounts'
import type { DiscountRule } from '@/lib/discounts'
import { FREE_SHIPPING_THRESHOLD } from '@/lib/shipping'

export default function CartPage() {
  const {
    items, isReady, removeItem, updateQuantity,
    subtotal, itemCount,
    appliedDiscount, discountAmount, applyDiscount, removeDiscount,
    savedItems, loadSavedItems, saveForLater, moveToCart, removeSaved,
  } = useCart()

  const [checkingOut, setCheckingOut] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)
  // First-time-only codes aren't applied to the cart; customer enters them in Stripe checkout
  const [pendingFirstTimeCode, setPendingFirstTimeCode] = useState<string | null>(null)

  // Load saved items from DB when cart page mounts
  useEffect(() => { loadSavedItems() }, [])

  // Automatic volume deal discounts
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([])
  useEffect(() => {
    getActiveDiscountRules().then(rules => setDiscountRules(rules as DiscountRule[]))
  }, [])

  const cartItemsForDiscount = items.map(i => ({
    tags: i.tags ?? [],
    price: i.price,
    quantity: i.quantity,
  }))
  const autoDiscounts = calculateRuleDiscounts(cartItemsForDiscount, discountRules)
  const autoDiscountTotal = autoDiscounts.reduce((sum, d) => sum + d.discountAmount, 0)
  const dealNudges = calculateDealNudges(cartItemsForDiscount, discountRules)

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return
    setCouponError(null)
    setCouponLoading(true)
    try {
      const result = await validateDiscountCode(couponInput.trim(), subtotal)
      if (!result.valid) {
        setCouponError(result.error)
      } else if (result.firstTimeOnly) {
        // Don't apply to cart; Stripe validates these properly at checkout
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

  // Don't render cart contents until localStorage has been read:
  // prevents a flash of empty state on page load
  if (!isReady) {
    return (
      <>
        <Nav />
        <main style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem 1.5rem' }} />
      </>
    )
  }

  const hasFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD
  const amountToFreeShipping = FREE_SHIPPING_THRESHOLD - subtotal

  const total = Math.max(0, subtotal - discountAmount - autoDiscountTotal)

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
                border: '1.5px solid var(--accent-border)',
                color: 'var(--foreground)',
                padding: '0.75rem 1.75rem',
                borderRadius: '0.625rem',
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
                          borderRadius: '0.625rem',
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

                      {/* Save for later */}
                      <button
                        onClick={() => saveForLater(item.variantId)}
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
                        Save for later
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

                {/* Auto discount lines (volume deals) */}
                {autoDiscounts.map((d) => (
                  <div key={d.ruleId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, background: '#dcfce7', color: '#166534', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                        DEAL
                      </span>
                      <span style={{ opacity: 0.6, fontSize: '0.82rem' }}>{d.name}</span>
                    </span>
                    <span style={{ fontWeight: 500, color: '#166534' }}>−${d.discountAmount.toFixed(2)}</span>
                  </div>
                ))}

                {/* Promo code discount line */}
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
                  {hasFreeShipping
                    ? <span style={{ fontWeight: 600, color: '#166534' }}>Free</span>
                    : <span style={{ opacity: 0.5, fontSize: '0.82rem' }}>Calculated at checkout</span>
                  }
                </div>
              </div>

              {/* First-time-only code (redirect to Stripe for validation) */}
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
                      New customer code. Enter it at Stripe checkout to apply your discount.
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

              {/* Deal nudges */}
              {dealNudges.map((nudge) => (
                <div
                  key={nudge.ruleId}
                  style={{
                    margin: '0.75rem 0 0',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '0.5rem',
                    background: '#fef9c3',
                    fontSize: '0.8rem',
                    color: '#854d0e',
                    fontWeight: 500,
                  }}
                >
                  {nudge.message}
                </div>
              ))}

              {/* Free shipping banner / nudge */}
              {hasFreeShipping ? (
                <div style={{
                  margin: '0.75rem 0 0',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '0.5rem',
                  background: '#dcfce7',
                  fontSize: '0.8rem',
                  color: '#166534',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}>
                  <span>✓</span> Free shipping unlocked!
                </div>
              ) : (
                <div style={{
                  margin: '0.75rem 0 0',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '0.5rem',
                  background: '#fef9c3',
                  fontSize: '0.8rem',
                  color: '#854d0e',
                  fontWeight: 500,
                }}>
                  Add ${amountToFreeShipping.toFixed(2)} more for free shipping
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
                  borderRadius: '0.625rem',
                  background: 'var(--accent)',
                  color: 'var(--foreground)',
                  border: '1.5px solid var(--accent-border)',
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
                {hasFreeShipping ? 'Taxes calculated at checkout' : 'Taxes and shipping calculated at checkout'}
              </p>
            </div>
          </div>
        )}

        {/* Saved for later */}
        {savedItems.length > 0 && (
          <div style={{ marginTop: '4rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.75rem',
                marginBottom: '1.5rem',
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.5rem',
                  fontWeight: 400,
                  letterSpacing: '-0.01em',
                  margin: 0,
                }}
              >
                Saved for later
              </h2>
              <span style={{ fontSize: '0.8rem', opacity: 0.4 }}>
                {savedItems.length} item{savedItems.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
                gap: '1px',
                border: '1px solid var(--border)',
                borderRadius: '0.875rem',
                overflow: 'hidden',
                background: 'var(--border)',
              }}
            >
              {savedItems.map((item) => (
                <div
                  key={item.variantId}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '1.25rem',
                    background: 'var(--background)',
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Image */}
                  <Link href={`/products/${item.handle}`} style={{ flexShrink: 0 }}>
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: '0.5rem',
                        overflow: 'hidden',
                        background: 'var(--muted)',
                        position: 'relative',
                        opacity: 0.85,
                      }}
                    >
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          sizes="72px"
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
                            fontSize: '1.25rem',
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
                        fontSize: '0.875rem',
                        lineHeight: 1.3,
                        color: 'var(--foreground)',
                        textDecoration: 'none',
                        display: 'block',
                        marginBottom: '0.15rem',
                      }}
                    >
                      {item.title}
                    </Link>

                    {item.variantTitle && (
                      <p style={{ fontSize: '0.775rem', opacity: 0.4, margin: '0 0 0.625rem' }}>
                        {item.variantTitle}
                      </p>
                    )}

                    <p style={{ fontSize: '0.85rem', fontWeight: 500, margin: '0 0 0.75rem', opacity: 0.7 }}>
                      ${item.price.toFixed(2)}
                    </p>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button
                        onClick={() => moveToCart(item.variantId)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          padding: 0,
                          color: 'var(--foreground)',
                          fontFamily: 'var(--font-sans)',
                          textDecoration: 'underline',
                          textUnderlineOffset: '3px',
                        }}
                      >
                        Move to cart
                      </button>
                      <button
                        onClick={() => removeSaved(item.variantId)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          opacity: 0.35,
                          padding: 0,
                          color: 'var(--foreground)',
                          fontFamily: 'var(--font-sans)',
                        }}
                        className="hover:opacity-60"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  )
}
