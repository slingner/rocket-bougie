'use client'

import Image from 'next/image'
import Link from 'next/link'
import Nav from '@/components/Nav'
import { useCart } from '@/lib/cart'

export default function CartPage() {
  const { items, isReady, removeItem, updateQuantity, subtotal, itemCount } = useCart()

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
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ opacity: 0.6 }}>Shipping</span>
                  <span style={{ opacity: 0.5, fontSize: '0.82rem' }}>Calculated at checkout</span>
                </div>
              </div>

              <div
                style={{
                  borderTop: '1px solid var(--border)',
                  margin: '1.25rem 0',
                  paddingTop: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Total</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
                  ${subtotal.toFixed(2)}
                </span>
              </div>

              <button
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '100px',
                  background: 'var(--accent)',
                  color: 'var(--foreground)',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  letterSpacing: '0.01em',
                  fontFamily: 'var(--font-sans)',
                  transition: 'opacity 0.15s',
                }}
                className="hover:opacity-80"
              >
                Checkout
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
