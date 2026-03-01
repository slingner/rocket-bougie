import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Order Details | Rocket Boogie' }

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/account/login')

  // RLS ensures users can only read their own orders
  const { data: order } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      created_at,
      status,
      fulfillment_status,
      subtotal,
      shipping_total,
      tax_total,
      total,
      tracking_number,
      tracking_url,
      shipping_name,
      shipping_address1,
      shipping_address2,
      shipping_city,
      shipping_state,
      shipping_zip,
      shipping_country,
      order_items (
        id, title, variant_title, quantity, unit_price, total_price, image_url
      )
    `)
    .eq('id', id)
    .single()

  if (!order) notFound()

  const statusLabel =
    order.fulfillment_status === 'fulfilled'
      ? 'Shipped'
      : order.status === 'paid'
      ? 'Processing'
      : order.status === 'cancelled'
      ? 'Cancelled'
      : order.status === 'refunded'
      ? 'Refunded'
      : 'Pending'

  const statusColor =
    statusLabel === 'Shipped'
      ? { color: '#166534', bg: '#dcfce7' }
      : statusLabel === 'Processing'
      ? { color: '#92400e', bg: '#fef3c7' }
      : statusLabel === 'Cancelled' || statusLabel === 'Refunded'
      ? { color: '#991b1b', bg: '#fee2e2' }
      : { color: '#1a1a1a', bg: 'var(--border)' }

  const isShipped = order.fulfillment_status === 'fulfilled' || statusLabel === 'Shipped'

  return (
    <>
      <Nav />
      <main style={{ maxWidth: 680, margin: '0 auto', padding: '2rem 1.5rem 6rem' }}>

        {/* Back link */}
        <Link
          href="/account"
          style={{
            fontSize: '0.875rem',
            opacity: 0.45,
            textDecoration: 'none',
            color: 'inherit',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            marginBottom: '1.75rem',
          }}
        >
          ← Back to account
        </Link>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '2rem',
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                margin: '0 0 0.25rem',
              }}
            >
              Order #{order.order_number}
            </h1>
            <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.45 }}>
              Placed{' '}
              {new Date(order.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.3rem 0.875rem',
              borderRadius: '100px',
              background: statusColor.bg,
              color: statusColor.color,
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.02em',
              flexShrink: 0,
              marginTop: '0.25rem',
            }}
          >
            {statusLabel}
          </span>
        </div>

        {/* Tracking info (only shown when shipped) */}
        {isShipped && (order.tracking_number || order.tracking_url) && (
          <div
            style={{
              background: '#dcfce7',
              border: '1px solid #bbf7d0',
              borderRadius: '0.875rem',
              padding: '1.25rem 1.5rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <p style={{ margin: '0 0 0.2rem', fontWeight: 600, fontSize: '0.875rem', color: '#166534' }}>
                Your order is on its way!
              </p>
              {order.tracking_number && (
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#166534', opacity: 0.7 }}>
                  Tracking: {order.tracking_number}
                </p>
              )}
            </div>
            {order.tracking_url && (
              <a
                href={order.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#166534',
                  color: '#fff',
                  padding: '0.55rem 1.125rem',
                  borderRadius: '100px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  flexShrink: 0,
                }}
              >
                Track package →
              </a>
            )}
          </div>
        )}

        {/* Items */}
        <section style={{ marginBottom: '1.5rem' }}>
          <h2
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              opacity: 0.4,
              margin: '0 0 0.625rem',
            }}
          >
            Items
          </h2>
          <div style={{ background: 'var(--muted)', borderRadius: '0.875rem', overflow: 'hidden' }}>
            {(order.order_items as OrderItem[]).map((item, i) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 1.25rem',
                  borderBottom:
                    i < order.order_items.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image_url}
                    alt={item.title}
                    style={{
                      width: 56,
                      height: 56,
                      objectFit: 'cover',
                      borderRadius: '0.5rem',
                      flexShrink: 0,
                      background: 'var(--border)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '0.5rem',
                      background: 'var(--border)',
                      flexShrink: 0,
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 500, fontSize: '0.9rem' }}>{item.title}</p>
                  {item.variant_title && item.variant_title !== 'Default Title' && (
                    <p style={{ margin: '0.125rem 0 0', fontSize: '0.8rem', opacity: 0.5 }}>
                      {item.variant_title}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.875rem', flexShrink: 0 }}>
                  <p style={{ margin: 0, opacity: 0.45 }}>×{item.quantity}</p>
                  <p style={{ margin: 0, fontWeight: 500 }}>${Number(item.total_price).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Summary + Shipping (side by side on wider screens, stacked on mobile) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
          }}
        >
          {/* Order totals */}
          <section>
            <h2
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                opacity: 0.4,
                margin: '0 0 0.625rem',
              }}
            >
              Summary
            </h2>
            <div
              style={{
                background: 'var(--muted)',
                borderRadius: '0.875rem',
                padding: '1.25rem 1.5rem',
              }}
            >
              <dl
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  margin: 0,
                }}
              >
                <dt style={{ opacity: 0.5 }}>Subtotal</dt>
                <dd style={{ margin: 0, textAlign: 'right' }}>
                  ${Number(order.subtotal).toFixed(2)}
                </dd>
                <dt style={{ opacity: 0.5 }}>Shipping</dt>
                <dd style={{ margin: 0, textAlign: 'right' }}>
                  ${Number(order.shipping_total).toFixed(2)}
                </dd>
                <dt style={{ opacity: 0.5 }}>Tax</dt>
                <dd style={{ margin: 0, textAlign: 'right' }}>
                  ${Number(order.tax_total).toFixed(2)}
                </dd>
                <dt
                  style={{
                    fontWeight: 600,
                    borderTop: '1px solid var(--border)',
                    paddingTop: '0.5rem',
                    marginTop: '0.25rem',
                  }}
                >
                  Total
                </dt>
                <dd
                  style={{
                    margin: 0,
                    textAlign: 'right',
                    fontWeight: 600,
                    borderTop: '1px solid var(--border)',
                    paddingTop: '0.5rem',
                    marginTop: '0.25rem',
                  }}
                >
                  ${Number(order.total).toFixed(2)}
                </dd>
              </dl>
            </div>
          </section>

          {/* Shipping address */}
          {order.shipping_name && (
            <section>
              <h2
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  opacity: 0.4,
                  margin: '0 0 0.625rem',
                }}
              >
                Ship to
              </h2>
              <div
                style={{
                  background: 'var(--muted)',
                  borderRadius: '0.875rem',
                  padding: '1.25rem 1.5rem',
                }}
              >
                <address
                  style={{
                    fontSize: '0.875rem',
                    fontStyle: 'normal',
                    lineHeight: 1.7,
                    opacity: 0.7,
                    margin: 0,
                  }}
                >
                  {order.shipping_name}
                  <br />
                  {order.shipping_address1}
                  <br />
                  {order.shipping_address2 && (
                    <>
                      {order.shipping_address2}
                      <br />
                    </>
                  )}
                  {order.shipping_city}, {order.shipping_state} {order.shipping_zip}
                  <br />
                  {order.shipping_country}
                </address>
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  )
}

type OrderItem = {
  id: string
  title: string
  variant_title: string | null
  quantity: number
  unit_price: number
  total_price: number
  image_url: string | null
}
