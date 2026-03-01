import { redirect } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import SignOutButton from '@/components/SignOutButton'
import { createClient } from '@/lib/supabase/server'

export default async function AccountPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/account/login')

  // Fetch orders by email (includes both orders placed while logged in
  // and guest orders with the same email address)
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      created_at,
      status,
      fulfillment_status,
      total,
      order_items (id)
    `)
    .eq('email', user.email!)
    .order('created_at', { ascending: false })

  return (
    <>
      <Nav />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem 6rem' }}>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '2.5rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                margin: '0 0 0.25rem',
              }}
            >
              My account
            </h1>
            <p style={{ opacity: 0.45, fontSize: '0.875rem', margin: 0 }}>{user.email}</p>
          </div>
          <SignOutButton />
        </div>

        {/* Orders */}
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.4rem',
            fontWeight: 400,
            letterSpacing: '-0.01em',
            margin: '0 0 1.25rem',
          }}
        >
          Order history
        </h2>

        {!orders || orders.length === 0 ? (
          <div
            style={{
              background: 'var(--muted)',
              borderRadius: '1rem',
              padding: '3rem',
              textAlign: 'center',
            }}
          >
            <p style={{ opacity: 0.5, margin: '0 0 1.25rem' }}>No orders yet.</p>
            <Link
              href="/shop"
              style={{
                background: 'var(--accent)',
                color: 'var(--foreground)',
                padding: '0.75rem 1.5rem',
                borderRadius: '100px',
                fontSize: '0.875rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Browse the shop
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                style={{
                  background: 'var(--muted)',
                  borderRadius: '0.875rem',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div>
                  <p style={{ margin: '0 0 0.2rem', fontWeight: 500, fontSize: '0.95rem' }}>
                    Order #{order.order_number}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.5 }}>
                    {new Date(order.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    {' · '}
                    {order.order_items?.length ?? 0} item{(order.order_items?.length ?? 0) !== 1 ? 's' : ''}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <StatusBadge status={order.status} fulfillment={order.fulfillment_status} />
                  <p style={{ margin: 0, fontWeight: 500, fontSize: '0.95rem' }}>
                    ${Number(order.total).toFixed(2)}
                  </p>
                  <span style={{ opacity: 0.3, fontSize: '0.875rem' }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  )
}

function StatusBadge({
  status,
  fulfillment,
}: {
  status: string
  fulfillment: string | null
}) {
  const label =
    fulfillment === 'fulfilled'
      ? 'Shipped'
      : status === 'paid'
      ? 'Processing'
      : status === 'cancelled'
      ? 'Cancelled'
      : status === 'refunded'
      ? 'Refunded'
      : 'Pending'

  const color =
    label === 'Shipped'
      ? '#166534'
      : label === 'Processing'
      ? '#92400e'
      : label === 'Cancelled' || label === 'Refunded'
      ? '#991b1b'
      : '#1a1a1a'

  const bg =
    label === 'Shipped'
      ? '#dcfce7'
      : label === 'Processing'
      ? '#fef3c7'
      : label === 'Cancelled' || label === 'Refunded'
      ? '#fee2e2'
      : 'var(--border)'

  return (
    <span
      style={{
        fontSize: '0.75rem',
        fontWeight: 600,
        padding: '0.25rem 0.75rem',
        borderRadius: '100px',
        background: bg,
        color,
        fontFamily: 'var(--font-sans)',
        letterSpacing: '0.02em',
      }}
    >
      {label}
    </span>
  )
}
