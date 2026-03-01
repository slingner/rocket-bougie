import { redirect } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import ClearCart from '@/components/ClearCart'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

interface ConfirmationPageProps {
  searchParams: Promise<{ session_id?: string }>
}

export default async function ConfirmationPage({ searchParams }: ConfirmationPageProps) {
  const { session_id } = await searchParams

  if (!session_id) redirect('/shop')

  const session = await stripe.checkout.sessions.retrieve(session_id, {
    expand: ['line_items'],
  })

  if (session.payment_status !== 'paid') redirect('/cart')

  const lineItems = session.line_items?.data ?? []
  const total = session.amount_total ? session.amount_total / 100 : 0
  const email = session.customer_details?.email
  const name = session.customer_details?.name

  // Check if they're already logged in; if so, don't show the create account prompt
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const showCreateAccount = !user && !!email
  // shipping_details is present at runtime but the 'clover' TS types don't declare it
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addr = (session as any).shipping_details?.address as
    | { line1?: string; line2?: string; city?: string; state?: string; postal_code?: string }
    | undefined

  return (
    <>
      <Nav />
      {/* Clears the cart in localStorage now that the order is placed */}
      <ClearCart />

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎉</p>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2rem, 4vw, 2.75rem)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              margin: '0 0 0.75rem',
            }}
          >
            Order confirmed!
          </h1>
          {email && (
            <p style={{ opacity: 0.55, fontSize: '0.9rem', margin: 0 }}>
              A confirmation will be sent to <strong>{email}</strong>
            </p>
          )}
        </div>

        {/* Order summary card */}
        <div
          style={{
            background: 'var(--muted)',
            borderRadius: '1rem',
            padding: '1.75rem',
            marginBottom: '1.5rem',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.25rem',
              fontWeight: 400,
              margin: '0 0 1.25rem',
              letterSpacing: '-0.01em',
            }}
          >
            What you ordered
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {lineItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  fontSize: '0.9rem',
                  gap: '1rem',
                }}
              >
                <span>
                  {item.description}
                  {(item.quantity ?? 1) > 1 && (
                    <span style={{ opacity: 0.5 }}> × {item.quantity}</span>
                  )}
                </span>
                <span style={{ fontWeight: 500, flexShrink: 0 }}>
                  ${((item.amount_total ?? 0) / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              borderTop: '1px solid var(--border)',
              marginTop: '1.25rem',
              paddingTop: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 600,
            }}
          >
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Shipping address */}
        {addr && (
          <div
            style={{
              background: 'var(--muted)',
              borderRadius: '1rem',
              padding: '1.75rem',
              marginBottom: '1.5rem',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.25rem',
                fontWeight: 400,
                margin: '0 0 0.75rem',
                letterSpacing: '-0.01em',
              }}
            >
              Shipping to
            </h2>
            <p
              style={{
                fontSize: '0.9rem',
                lineHeight: 1.7,
                opacity: 0.7,
                margin: 0,
              }}
            >
              {name && <>{name}<br /></>}
              {addr.line1}<br />
              {addr.line2 && <>{addr.line2}<br /></>}
              {addr.city}, {addr.state} {addr.postal_code}
            </p>
          </div>
        )}

        {/* Create account prompt */}
        {showCreateAccount && (
          <div
            style={{
              background: 'var(--muted)',
              borderRadius: '1rem',
              padding: '1.75rem',
              marginTop: '1.5rem',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.2rem',
                margin: '0 0 0.5rem',
                letterSpacing: '-0.01em',
              }}
            >
              Want to track this order?
            </p>
            <p style={{ opacity: 0.55, fontSize: '0.875rem', margin: '0 0 1.25rem', lineHeight: 1.5 }}>
              Create an account to view your order history and track shipments.
            </p>
            <Link
              href={`/account/register?email=${encodeURIComponent(email!)}`}
              style={{
                background: 'var(--foreground)',
                color: 'var(--background)',
                padding: '0.75rem 1.5rem',
                borderRadius: '100px',
                fontSize: '0.875rem',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Create account
            </Link>
          </div>
        )}

        {/* Back to shop */}
        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <Link
            href="/shop"
            style={{
              background: 'var(--accent)',
              color: 'var(--foreground)',
              padding: '0.875rem 2rem',
              borderRadius: '100px',
              fontSize: '0.95rem',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Continue shopping
          </Link>
        </div>

      </main>
    </>
  )
}
