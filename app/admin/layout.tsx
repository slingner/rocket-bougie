import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from '@/components/SignOutButton'

export const metadata = { title: 'Admin | Rocket Boogie' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect('/')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      {/* Sidebar */}
      <aside
        style={{
          borderRight: '1px solid var(--border)',
          padding: '1.5rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          position: 'sticky',
          top: 0,
          height: '100vh',
          flexShrink: 0,
        }}
        className="w-[160px] md:w-[220px]"
      >
        <Link
          href="/"
          style={{
            fontSize: '1rem',
            fontFamily: 'var(--font-serif)',
            fontWeight: 400,
            letterSpacing: '-0.01em',
            textDecoration: 'none',
            color: 'var(--foreground)',
            marginBottom: '1.5rem',
            display: 'block',
          }}
        >
          Rocket Boogie
        </Link>

        <p
          style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            opacity: 0.4,
            margin: '0 0 0.5rem 0.5rem',
          }}
        >
          Admin
        </p>

        <NavLink href="/admin/orders">Orders</NavLink>
        <NavLink href="/admin/products">Products</NavLink>
        <NavLink href="/admin/inventory">Inventory</NavLink>
        <NavLink href="/admin/discounts">Discounts</NavLink>
        <NavLink href="/admin/customers">Customers</NavLink>
        <NavLink href="/admin/analytics">Analytics</NavLink>
        <NavLink href="/admin/tags">Tags</NavLink>
        <NavLink href="/admin/newsletter">Newsletter</NavLink>
        <NavLink href="/admin/reviews">Reviews</NavLink>

        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.75rem', opacity: 0.45, margin: '0 0 0.75rem 0.5rem', wordBreak: 'break-all' }}>
            {user.email}
          </p>
          <SignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        display: 'block',
        padding: '0.5rem 0.75rem',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        textDecoration: 'none',
        color: 'var(--foreground)',
        transition: 'background 0.1s',
      }}
      className="hover:bg-[var(--muted)]"
    >
      {children}
    </Link>
  )
}
