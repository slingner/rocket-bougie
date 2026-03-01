import Nav from '@/components/Nav'

export const metadata = { title: 'Shipping Policy | Rocket Boogie Co.' }

export default function ShippingPage() {
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
          Shipping Policy
        </h1>
        <p style={{ opacity: 0.45, fontSize: '0.875rem', margin: '0 0 3rem' }}>
          Last updated: February 2026
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', lineHeight: 1.75, fontSize: '0.95rem' }}>

          <section>
            <h2 style={h2}>Shipping times</h2>
            <p style={p}>
              Most domestic US orders arrive within <strong>5–7 business days</strong> via USPS First
              Class Mail. Processing time — packing and preparing your order — is not included in
              that estimate, so please allow a couple of extra days after you receive your shipping
              confirmation.
            </p>
            <p style={p}>
              International deliveries typically take <strong>7 or more business days</strong> after
              dispatch, depending on destination and customs processing.
            </p>
          </section>

          <section>
            <h2 style={h2}>International shipping</h2>
            <p style={p}>
              We ship worldwide. Shipping costs are calculated at checkout based on your destination.
            </p>
            <p style={p}>
              International customers are responsible for any import duties, customs fees, or taxes
              that apply when your order arrives in your country. These charges are set by your local
              customs authority and are outside our control.
            </p>
          </section>

          <section>
            <h2 style={h2}>Local pickup</h2>
            <p style={p}>
              We occasionally offer in-person pickup at events and pop-ups around San Francisco.
              Availability varies, so please{' '}
              <a href="mailto:hello@rocketboogie.com" style={{ color: 'inherit' }}>
                reach out before placing your order
              </a>{' '}
              if you're interested in this option. Fast, low-cost shipping is also available for
              local Bay Area orders.
            </p>
          </section>

          <section>
            <h2 style={h2}>Questions?</h2>
            <p style={p}>
              If you have any questions about your shipment, email us at{' '}
              <a href="mailto:hello@rocketboogie.com" style={{ color: 'inherit' }}>
                hello@rocketboogie.com
              </a>{' '}
              and we'll get back to you as soon as we can.
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
