import Nav from '@/components/Nav'

export const metadata = { title: 'Terms of Service | Rocket Boogie Co.' }

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p style={{ opacity: 0.45, fontSize: '0.875rem', margin: '0 0 3rem' }}>
          Last updated: February 2026
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', lineHeight: 1.75, fontSize: '0.95rem' }}>

          <section>
            <h2 style={h2}>About these terms</h2>
            <p style={p}>
              These Terms of Service govern your use of rocketboogie.com and any purchases you make
              from Rocket Boogie Co. ("we", "us", "our"). By using our site or placing an order,
              you agree to these terms. If you have questions, reach us at{' '}
              <a href="mailto:hello@rocketboogie.com" style={{ color: 'inherit' }}>hello@rocketboogie.com</a>.
            </p>
          </section>

          <section>
            <h2 style={h2}>Using our site</h2>
            <p style={p}>
              You may use this site for lawful purposes only. You agree not to:
            </p>
            <ul style={ul}>
              <li>Use the site in any way that violates applicable laws or regulations</li>
              <li>Attempt to gain unauthorized access to any part of the site or its infrastructure</li>
              <li>Scrape, copy, or redistribute our content without permission</li>
              <li>Submit false or fraudulent orders</li>
            </ul>
          </section>

          <section>
            <h2 style={h2}>Orders and payment</h2>
            <p style={p}>
              All prices are listed in US dollars. We reserve the right to refuse or cancel any order
              at our discretion, including in cases of pricing errors or suspected fraud. Payment is
              processed securely through Stripe. By placing an order, you represent that you are
              authorized to use the payment method provided.
            </p>
          </section>

          <section>
            <h2 style={h2}>Shipping</h2>
            <p style={p}>
              We ship within the United States. Shipping costs and estimated delivery times are
              shown at checkout. We are not responsible for delays caused by carriers or events
              outside our control. Once an order ships, title and risk of loss pass to you.
            </p>
          </section>

          <section>
            <h2 style={h2}>Returns and refunds</h2>
            <p style={p}>
              If your order arrives damaged or there's an error on our part, contact us within
              14 days of delivery at{' '}
              <a href="mailto:hello@rocketboogie.com" style={{ color: 'inherit' }}>hello@rocketboogie.com</a>{' '}
              and we'll make it right. Because our products are small-batch and often made to order,
              we generally cannot accept returns for buyer's remorse, but we'll always try to work
              something out.
            </p>
          </section>

          <section>
            <h2 style={h2}>Intellectual property</h2>
            <p style={p}>
              All artwork, images, and content on this site are owned by Rocket Boogie Co. and
              protected by copyright. You may not reproduce, distribute, or create derivative works
              from our artwork without explicit written permission. Purchasing a product grants you
              a license to display it for personal use only; it does not transfer copyright.
            </p>
          </section>

          <section>
            <h2 style={h2}>Disclaimer of warranties</h2>
            <p style={p}>
              This site and its contents are provided "as is" without warranties of any kind,
              express or implied. We do not guarantee that the site will be available at all times
              or free of errors.
            </p>
          </section>

          <section>
            <h2 style={h2}>Limitation of liability</h2>
            <p style={p}>
              To the fullest extent permitted by law, Rocket Boogie Co. shall not be liable for
              any indirect, incidental, or consequential damages arising from your use of the site
              or any products purchased. Our total liability to you for any claim shall not exceed
              the amount you paid for the order in question.
            </p>
          </section>

          <section>
            <h2 style={h2}>Governing law</h2>
            <p style={p}>
              These terms are governed by the laws of the State of California, without regard to
              its conflict of law provisions. Any disputes shall be resolved in the courts of
              San Francisco County, California.
            </p>
          </section>

          <section>
            <h2 style={h2}>Changes to these terms</h2>
            <p style={p}>
              We may update these terms from time to time. The date at the top of this page
              reflects the most recent revision. Continued use of the site after changes
              constitutes acceptance of the updated terms.
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
