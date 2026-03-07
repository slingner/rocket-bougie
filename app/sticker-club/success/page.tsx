import Link from 'next/link'

export default function StickerClubSuccessPage() {
  return (
    <main style={{ maxWidth: 520, margin: '0 auto', padding: '5rem 1.5rem', textAlign: 'center' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎉</div>
      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '2.25rem',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          margin: '0 0 1rem',
        }}
      >
        You&rsquo;re in the club!
      </h1>
      <p style={{ opacity: 0.65, lineHeight: 1.6, marginBottom: '2rem' }}>
        Thanks for subscribing to the Monthly Sticker Club. Your first pack will ship soon —
        keep an eye on your inbox for a confirmation.
      </p>
      <Link
        href="/shop"
        style={{
          display: 'inline-block',
          padding: '0.75rem 2rem',
          background: 'var(--foreground)',
          color: 'var(--background)',
          borderRadius: '0.5rem',
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: '0.9rem',
        }}
      >
        Browse the shop
      </Link>
    </main>
  )
}
