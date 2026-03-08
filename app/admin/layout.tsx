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
    <>
      <style>{`
        .admin-wrap { display: flex; min-height: 100vh; background: var(--background); }
        .admin-aside {
          border-right: 1px solid var(--border);
          padding: 1.5rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          position: sticky;
          top: 0;
          height: 100vh;
          flex-shrink: 0;
          width: 160px;
          overflow-y: auto;
        }
        @media (min-width: 768px) {
          .admin-aside { width: 220px; }
        }
        .admin-brand {
          font-size: 1rem;
          font-family: var(--font-serif);
          font-weight: 400;
          letter-spacing: -0.01em;
          text-decoration: none;
          color: var(--foreground);
          margin-bottom: 1.5rem;
          display: block;
          flex-shrink: 0;
        }
        .admin-section-label {
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          opacity: 0.4;
          margin: 0 0 0.5rem 0.5rem;
          flex-shrink: 0;
        }
        .admin-footer {
          margin-top: auto;
          padding-top: 1rem;
          border-top: 1px solid var(--border);
        }
        .admin-main { flex: 1; padding: 2rem; overflow-y: auto; min-width: 0; }

        @media (max-width: 767px) {
          .admin-wrap { flex-direction: column; }
          .admin-aside {
            position: static;
            height: auto;
            width: 100% !important;
            flex-direction: row;
            flex-wrap: nowrap;
            overflow-x: auto;
            overflow-y: hidden;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            padding: 0.625rem 0.75rem;
            border-right: none;
            border-bottom: 1px solid var(--border);
            gap: 0.25rem;
            align-items: center;
          }
          .admin-aside::-webkit-scrollbar { display: none; }
          .admin-brand { margin-bottom: 0; white-space: nowrap; margin-right: 0.5rem; }
          .admin-section-label { display: none; }
          .admin-footer { display: none; }
          .admin-main { padding: 1rem; }
        }
      `}</style>
      <div className="admin-wrap">
        {/* Sidebar / top nav */}
        <aside className="admin-aside">
          <Link href="/" className="admin-brand">
            Rocket Boogie
          </Link>

          <p className="admin-section-label">Admin</p>

          <NavLink href="/admin/orders">Orders</NavLink>
          <NavLink href="/admin/products">Products</NavLink>
          <NavLink href="/admin/inventory">Inventory</NavLink>
          <NavLink href="/admin/shipping">Shipping</NavLink>
          <NavLink href="/admin/discounts">Discounts</NavLink>
          <NavLink href="/admin/customers">Customers</NavLink>
          <NavLink href="/admin/analytics">Analytics</NavLink>
          <NavLink href="/admin/collections">Collections</NavLink>
          <NavLink href="/admin/tags">Tags</NavLink>
          <NavLink href="/admin/newsletter">Newsletter</NavLink>
          <NavLink href="/admin/reviews">Reviews</NavLink>
          <NavLink href="/admin/sticker-club">Sticker Club</NavLink>
          <NavLink href="/admin/subscriptions">Subscribers</NavLink>

          <div className="admin-footer">
            <p style={{ fontSize: '0.75rem', opacity: 0.45, margin: '0 0 0.75rem 0.5rem', wordBreak: 'break-all' }}>
              {user.email}
            </p>
            <SignOutButton />
          </div>
        </aside>

        {/* Main content */}
        <main className="admin-main">
          {children}
        </main>
      </div>
    </>
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
