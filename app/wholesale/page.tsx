import Nav from '@/components/Nav'

export const metadata = {
  title: 'Wholesale | Rocket Boogie Co.',
  description: 'Carry Rocket Boogie Co. in your shop. Browse and order wholesale through Faire.',
}

export default function WholesalePage() {
  return (
    <>
      <Nav />
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              margin: '0 0 0.75rem',
            }}
          >
            Wholesale
          </h1>
          <p style={{ opacity: 0.55, fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 0.5rem', maxWidth: 560 }}>
            Interested in carrying Rocket Boogie Co. in your shop? We partner with retailers
            through Faire. Browse our catalog and place orders below.
          </p>
          <a
            href="https://rocketboogieco.faire.com?utm_source=embed"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.8rem',
              opacity: 0.45,
              color: 'var(--foreground)',
              transition: 'opacity 0.15s',
            }}
            className="hover:opacity-100"
          >
            Open in Faire ↗
          </a>
        </div>

        {/* Faire embed */}
        <div
          style={{
            background: 'var(--muted)',
            borderRadius: '1rem',
            overflow: 'hidden',
            width: '100%',
          }}
        >
          <iframe
            src="https://www.faire.com/embed/bw_5pkgku37ku"
            width="900"
            height="600"
            scrolling="no"
            style={{
              margin: '0 auto',
              border: 'none',
              display: 'block',
              maxWidth: '100%',
              width: '900px',
              height: '600px',
            }}
            title="Rocket Boogie Co. on Faire"
          />
        </div>

      </main>
    </>
  )
}
