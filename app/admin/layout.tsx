import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from '@/components/SignOutButton'

export const metadata = { title: 'Admin — Rocket Boogie' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Middleware handles redirect, but double-check here for safety
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect('/')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 220,
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
        className="hidden md:flex"
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
        <NavLink href="/admin/tags">Tags</NavLink>

        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.75rem', opacity: 0.45, margin: '0 0 0.75rem 0.5rem', wordBreak: 'break-all' }}>
            {user.email}
          </p>
          <SignOutButton />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 52,
          background: 'var(--background)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 1rem',
          gap: '1rem',
          zIndex: 50,
        }}
        className="md:hidden"
      >
        <Link
          href="/"
          style={{ fontFamily: 'var(--font-serif)', fontSize: '0.95rem', textDecoration: 'none', color: 'var(--foreground)', marginRight: 'auto' }}
        >
          Rocket Boogie
        </Link>
        <Link href="/admin/orders" style={{ fontSize: '0.8rem', textDecoration: 'none', color: 'var(--foreground)', opacity: 0.6 }}>Orders</Link>
        <Link href="/admin/products" style={{ fontSize: '0.8rem', textDecoration: 'none', color: 'var(--foreground)', opacity: 0.6 }}>Products</Link>
        <Link href="/admin/inventory" style={{ fontSize: '0.8rem', textDecoration: 'none', color: 'var(--foreground)', opacity: 0.6 }}>Inventory</Link>
        <Link href="/admin/tags" style={{ fontSize: '0.8rem', textDecoration: 'none', color: 'var(--foreground)', opacity: 0.6 }}>Tags</Link>
      </div>

      {/* Main content */}
      <main
        style={{ flex: 1, paddingLeft: '2rem', paddingRight: '2rem', paddingBottom: '2rem', overflowY: 'auto' }}
        className="md:pt-8 pt-[68px]"
      >
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
