import Nav from '@/components/Nav'

export const metadata = { title: 'Privacy Policy | Rocket Boogie Co.' }

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p style={{ opacity: 0.45, fontSize: '0.875rem', margin: '0 0 3rem' }}>
          Last updated: February 2026
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', lineHeight: 1.75, fontSize: '0.95rem' }}>

          <section>
            <h2 style={h2}>Who we are</h2>
            <p style={p}>
              Rocket Boogie Co. ("we", "us", "our") operates rocketboogie.com, an online shop selling
              art prints, stickers, cards, and related goods. We're based in San Francisco, CA.
              Questions about this policy can be sent to{' '}
              <a href="mailto:hello@rocketboogie.com" style={{ color: 'inherit' }}>hello@rocketboogie.com</a>.
            </p>
          </section>

          <section>
            <h2 style={h2}>What we collect</h2>
            <p style={p}>When you place an order or create an account, we collect:</p>
            <ul style={ul}>
              <li>Name and email address</li>
              <li>Shipping address</li>
              <li>Payment information (processed securely by Stripe; we never see or store your card number)</li>
              <li>Order history</li>
            </ul>
            <p style={p}>
              When you browse the site, we may collect standard server logs including your IP address,
              browser type, and pages visited. We use this only to keep the site running and to
              understand general traffic patterns.
            </p>
          </section>

          <section>
            <h2 style={h2}>How we use it</h2>
            <ul style={ul}>
              <li>To fulfill and ship your orders</li>
              <li>To send order confirmation and shipping notification emails</li>
              <li>To respond to questions or support requests</li>
              <li>To improve the site and our products</li>
            </ul>
            <p style={p}>
              We do not sell, rent, or trade your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 style={h2}>Third-party services</h2>
            <p style={p}>We use the following services to operate our store:</p>
            <ul style={ul}>
              <li><strong>Stripe:</strong> payment processing. Your payment details go directly to Stripe and are subject to their privacy policy.</li>
              <li><strong>Supabase:</strong> secure database and authentication hosting.</li>
              <li><strong>Resend:</strong> transactional email delivery (order confirmations).</li>
              <li><strong>Vercel:</strong> website hosting.</li>
            </ul>
            <p style={p}>
              Each of these services has its own privacy policy and data practices. We only share
              the minimum information necessary for them to perform their function.
            </p>
          </section>

          <section>
            <h2 style={h2}>Cookies</h2>
            <p style={p}>
              We use cookies and browser storage to keep your shopping cart between visits and to
              maintain your login session. We do not use third-party advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 style={h2}>Your rights</h2>
            <p style={p}>
              You can request a copy of the personal data we hold about you, ask us to correct it,
              or ask us to delete it. To make a request, email{' '}
              <a href="mailto:hello@rocketboogie.com" style={{ color: 'inherit' }}>hello@rocketboogie.com</a>.
              We'll respond within 30 days.
            </p>
          </section>

          <section>
            <h2 style={h2}>Children</h2>
            <p style={p}>
              Our site is not directed at children under 13. We do not knowingly collect personal
              information from children.
            </p>
          </section>

          <section>
            <h2 style={h2}>Changes to this policy</h2>
            <p style={p}>
              We may update this policy from time to time. When we do, we'll update the date at
              the top of this page. Continued use of the site after changes constitutes acceptance
              of the updated policy.
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
