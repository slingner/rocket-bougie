import Nav from '@/components/Nav'

export const metadata = { title: 'Refund Policy | Rocket Boogie Co.' }

export default function RefundsPage() {
  return (
    <>
      <Nav />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2rem, 4vw, 2.75rem)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            margin: '0 0 0.5rem',
          }}
        >
          Refund Policy
        </h1>
        <p style={{ opacity: 0.45, fontSize: '0.875rem', margin: '0 0 3rem' }}>
          Last updated: February 2026
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', lineHeight: 1.75, fontSize: '0.95rem' }}>

          <section>
            <h2 style={h2}>Order cancellations</h2>
            <p style={p}>
              You can cancel your order within <strong>24 hours of placing it</strong>, as long as it
              hasn't shipped yet. Once an order has been dispatched we're unable to cancel it.
            </p>
            <p style={p}>
              To cancel, email{' '}
              <a href="mailto:hello@rocketboogie.com" style={{ color: 'inherit' }}>
                hello@rocketboogie.com
              </a>{' '}
              right away with your order number in the subject line.
            </p>
          </section>

          <section>
            <h2 style={h2}>Returns</h2>
            <p style={p}>
              We're not able to accept returns at this time — unless your item arrived damaged.
            </p>
            <p style={p}>
              If your order arrived damaged, you have <strong>7 days from the date of receipt</strong>{' '}
              to contact us. Email{' '}
              <a href="mailto:hello@rocketboogie.com" style={{ color: 'inherit' }}>
                hello@rocketboogie.com
              </a>{' '}
              with:
            </p>
            <ul style={ul}>
              <li>Your order number</li>
              <li>A photo showing the damage</li>
            </ul>
            <p style={p}>
              We'll make it right as quickly as we can.
            </p>
          </section>

          <section>
            <h2 style={h2}>Questions?</h2>
            <p style={p}>
              If something doesn't seem right with your order, please get in touch at{' '}
              <a href="mailto:hello@rocketboogie.com" style={{ color: 'inherit' }}>
                hello@rocketboogie.com
              </a>
              . We're a small shop and we want every order to be a good experience.
            </p>
          </section>

        </div>
      </main>
    </>
  )
}

const h2: React.CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontSize: '1.35rem',
  fontWeight: 400,
  letterSpacing: '-0.01em',
  margin: '0 0 0.75rem',
}

const p: React.CSSProperties = {
  margin: '0 0 0.75rem',
  opacity: 0.8,
}

const ul: React.CSSProperties = {
  margin: '0 0 0.75rem',
  paddingLeft: '1.5rem',
  opacity: 0.8,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
}
