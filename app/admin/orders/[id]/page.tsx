import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { updateOrder } from '../../actions'
import LabelPurchaser from './LabelPurchaser'

export const metadata = { title: 'Order Detail | Admin' }

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ saved?: string }>
}) {
  const { id } = await params
  const { saved } = await searchParams
  const supabase = await createAdminClient()

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id, title, variant_title, quantity, unit_price, total_price, image_url
      )
    `)
    .eq('id', id)
    .single()

  if (!order) notFound()

  async function saveOrder(formData: FormData) {
    'use server'
    await updateOrder(id, {
      status: formData.get('status') as string,
      fulfillment_status: formData.get('fulfillment_status') as string,
      tracking_number: formData.get('tracking_number') as string || undefined,
      tracking_url: formData.get('tracking_url') as string || undefined,
    })
    redirect(`/admin/orders/${id}?saved=1`)
  }

  return (
    <div style={{ maxWidth: 860 }}>

      {saved === '1' && (
        <div
          style={{
            background: '#dcfce7',
            border: '1px solid #bbf7d0',
            color: '#166534',
            borderRadius: '0.625rem',
            padding: '0.75rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            marginBottom: '1.5rem',
          }}
        >
          Order saved.
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
        <Link
          href="/admin/orders"
          style={{ fontSize: '0.875rem', opacity: 0.5, textDecoration: 'none', color: 'inherit' }}
          className="hover:opacity-100"
        >
          ← Orders
        </Link>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.6rem',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          Order #{order.order_number}
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Order info */}
        <section
          style={{
            background: 'var(--muted)',
            borderRadius: '0.875rem',
            padding: '1.25rem 1.5rem',
          }}
        >
          <h2 style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.4, margin: '0 0 1rem' }}>
            Order info
          </h2>
          <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.4rem 1rem', fontSize: '0.875rem', margin: 0 }}>
            <dt style={{ opacity: 0.5 }}>Date</dt>
            <dd style={{ margin: 0 }}>
              {new Date(order.created_at).toLocaleDateString('en-US', {
                weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
              })}
            </dd>
            <dt style={{ opacity: 0.5 }}>Email</dt>
            <dd style={{ margin: 0 }}>{order.email}</dd>
            <dt style={{ opacity: 0.5 }}>Subtotal</dt>
            <dd style={{ margin: 0 }}>${Number(order.subtotal).toFixed(2)}</dd>
            <dt style={{ opacity: 0.5 }}>Shipping</dt>
            <dd style={{ margin: 0 }}>${Number(order.shipping_total).toFixed(2)}</dd>
            <dt style={{ opacity: 0.5 }}>Tax</dt>
            <dd style={{ margin: 0 }}>${Number(order.tax_total).toFixed(2)}</dd>
            <dt style={{ opacity: 0.5, fontWeight: 600 }}>Total</dt>
            <dd style={{ margin: 0, fontWeight: 600 }}>${Number(order.total).toFixed(2)}</dd>
          </dl>
        </section>

        {/* Shipping address */}
        <section
          style={{
            background: 'var(--muted)',
            borderRadius: '0.875rem',
            padding: '1.25rem 1.5rem',
          }}
        >
          <h2 style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.4, margin: '0 0 1rem' }}>
            Ship to
          </h2>
          {order.shipping_name ? (
            <address style={{ fontSize: '0.875rem', fontStyle: 'normal', lineHeight: 1.6, opacity: 0.75 }}>
              {order.shipping_name}<br />
              {order.shipping_address1}<br />
              {order.shipping_address2 && <>{order.shipping_address2}<br /></>}
              {order.shipping_city}, {order.shipping_state} {order.shipping_zip}<br />
              {order.shipping_country}
            </address>
          ) : (
            <p style={{ fontSize: '0.875rem', opacity: 0.4, margin: 0 }}>No address on file</p>
          )}
        </section>
      </div>

      {/* Line items */}
      <section style={{ marginTop: '1.5rem' }}>
        <h2
          style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            opacity: 0.4,
            margin: '0 0 0.75rem',
          }}
        >
          Items
        </h2>
        <div
          style={{
            background: 'var(--muted)',
            borderRadius: '0.875rem',
            overflow: 'hidden',
          }}
        >
          {order.order_items.map((item: {
            id: string
            image_url: string | null
            title: string
            variant_title: string | null
            quantity: number
            unit_price: number
            total_price: number
          }) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem 1.25rem',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image_url}
                  alt={item.title}
                  style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: '0.5rem', flexShrink: 0, background: 'var(--border)' }}
                />
              ) : (
                <div style={{ width: 52, height: 52, borderRadius: '0.5rem', background: 'var(--border)', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 500, fontSize: '0.9rem' }}>{item.title}</p>
                {item.variant_title && (
                  <p style={{ margin: '0.125rem 0 0', fontSize: '0.8rem', opacity: 0.5 }}>{item.variant_title}</p>
                )}
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.875rem' }}>
                <p style={{ margin: 0, opacity: 0.5 }}>×{item.quantity}</p>
                <p style={{ margin: 0, fontWeight: 500 }}>${Number(item.total_price).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <LabelPurchaser
        orderId={id}
        existingLabelUrl={order.label_url ?? null}
        existingTrackingNumber={order.tracking_number ?? null}
      />

      {/* Edit status + tracking */}
      <section style={{ marginTop: '1.5rem' }}>
        <h2
          style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            opacity: 0.4,
            margin: '0 0 0.75rem',
          }}
        >
          Update order
        </h2>
        <form
          action={saveOrder}
          style={{
            background: 'var(--muted)',
            borderRadius: '0.875rem',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 500, opacity: 0.6 }}>Order status</span>
              <select
                name="status"
                defaultValue={order.status}
                style={selectStyle}
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="refunded">Refunded</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 500, opacity: 0.6 }}>Fulfillment status</span>
              <select
                name="fulfillment_status"
                defaultValue={order.fulfillment_status ?? 'unfulfilled'}
                style={selectStyle}
              >
                <option value="unfulfilled">Unfulfilled</option>
                <option value="partial">Partial</option>
                <option value="fulfilled">Fulfilled</option>
              </select>
            </label>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 500, opacity: 0.6 }}>Tracking number</span>
            <input
              name="tracking_number"
              type="text"
              defaultValue={order.tracking_number ?? ''}
              placeholder="e.g. 1Z999AA10123456784"
              style={inputStyle}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 500, opacity: 0.6 }}>Tracking URL</span>
            <input
              name="tracking_url"
              type="url"
              defaultValue={order.tracking_url ?? ''}
              placeholder="https://tools.usps.com/..."
              style={inputStyle}
            />
          </label>

          <div>
            <button type="submit" style={submitButtonStyle}>
              Save changes
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '0.6rem 0.875rem',
  borderRadius: '0.5rem',
  border: '1px solid var(--border)',
  background: 'var(--background)',
  fontSize: '0.875rem',
  color: 'var(--foreground)',
  fontFamily: 'inherit',
  width: '100%',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
}

const submitButtonStyle: React.CSSProperties = {
  background: 'var(--foreground)',
  color: 'var(--background)',
  border: 'none',
  padding: '0.65rem 1.5rem',
  borderRadius: '0.5rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}
