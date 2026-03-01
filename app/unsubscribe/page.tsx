import { unsubscribeByToken } from '@/app/admin/newsletter/actions'
import Link from 'next/link'

export const metadata = { title: 'Unsubscribe | Rocket Boogie Co.' }

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const token = searchParams.token

  if (!token) {
    return <UnsubscribeLayout>
      <p style={msgStyle}>No unsubscribe token provided.</p>
      <Link href="/" style={linkStyle}>Back to shop</Link>
    </UnsubscribeLayout>
  }

  let success = false
  try {
    await unsubscribeByToken(token)
    success = true
  } catch {
    success = false
  }

  return (
    <UnsubscribeLayout>
      {success ? (
        <>
          <p style={{ ...msgStyle, marginBottom: '0.5rem' }}>You've been unsubscribed.</p>
          <p style={{ margin: '0 0 1.5rem', fontSize: '0.875rem', opacity: 0.55 }}>
            You won't receive any more emails from us.
          </p>
          <Link href="/" style={linkStyle}>Back to shop</Link>
        </>
      ) : (
        <>
          <p style={msgStyle}>Something went wrong — that link may have already been used.</p>
          <Link href="/" style={linkStyle}>Back to shop</Link>
        </>
      )}
    </UnsubscribeLayout>
  )
}

function UnsubscribeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--background)',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <Link
        href="/"
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.25rem',
          letterSpacing: '0.05em',
          textDecoration: 'none',
          color: 'var(--foreground)',
          marginBottom: '2.5rem',
          display: 'block',
        }}
      >
        Rocket Boogie Co.
      </Link>
      {children}
    </div>
  )
}

const msgStyle: React.CSSProperties = {
  fontSize: '1rem',
  margin: '0 0 1rem',
  maxWidth: 360,
}

const linkStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--foreground)',
  opacity: 0.55,
  textDecoration: 'underline',
}
