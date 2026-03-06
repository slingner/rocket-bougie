import { createAdminClient } from '@/lib/supabase/server'
import OrdersTable from './OrdersTable'

export const metadata = { title: 'Orders | Admin' }

export default async function OrdersPage() {
  const supabase = await createAdminClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, email, created_at, status, fulfillment_status, total')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.75rem',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          margin: '0 0 1.5rem',
        }}
      >
        Orders
      </h1>
      <OrdersTable orders={orders ?? []} />
    </div>
  )
}
