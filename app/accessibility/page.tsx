import Nav from '@/components/Nav'

export const metadata = { title: 'Accessibility | Rocket Boogie Co.' }

export default function AccessibilityPage() {
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
          Accessibility Statement
        </h1>
        <p style={{ opacity: 0.45, fontSize: '0.875rem', margin: '0 0 3rem' }}>
          Last updated: March 2026
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', lineHeight: 1.75, fontSize: '0.95rem' }}>

          <section>
            <h2 style={h2}>Our commitment</h2>
            <p style={p}>
              Rocket Boogie Co. is committed to making rocketboogie.com accessible to everyone,
              including people with visual, hearing, cognitive, and motor impairments. We believe
              art and joy should be available to all.
            </p>
            <p style={p}>
              We aim to meet the{' '}
              <a href="https://www.w3.org/WAI/standards-guidelines/wcag/" style={{ color: 'inherit' }} target="_blank" rel="noopener noreferrer">
                Web Content Accessibility Guidelines (WCAG) 2.1
              </a>{' '}
              at Level AA. These guidelines are organized around four principles:
            </p>
            <ul style={ul}>
              <li><strong>Perceivable</strong> — content is presented in ways everyone can perceive</li>
              <li><strong>Operable</strong> — all functionality is available via keyboard and assistive technology</li>
              <li><strong>Understandable</strong> — content and navigation are clear and predictable</li>
              <li><strong>Robust</strong> — content works reliably across a wide range of browsers and assistive technologies</li>
            </ul>
          </section>

          <section>
            <h2 style={h2}>What we&apos;ve done</h2>
            <ul style={ul}>
              <li>Semantic HTML landmarks (<code>header</code>, <code>nav</code>, <code>main</code>, <code>footer</code>) throughout the site</li>
              <li>Keyboard-navigable menus and dropdowns</li>
              <li>Skip-to-content link at the top of every page</li>
              <li>Visible focus indicators for all interactive elements</li>
              <li>Alt text on all product images</li>
              <li>ARIA labels on icon-only buttons and interactive controls</li>
              <li>Form inputs paired with visible labels</li>
              <li>Star ratings announced to screen readers with descriptive text</li>
            </ul>
          </section>

          <section>
            <h2 style={h2}>Feedback and contact</h2>
            <p style={p}>
              If you experience any difficulty accessing content on rocketboogie.com, please let us know.
              Include the URL of the page you were visiting and a description of the problem, and we&apos;ll
              get back to you as soon as we can.
            </p>
            <p style={p}>
              Email:{' '}
              <a href="mailto:hello@rocketboogie.com" style={{ color: 'inherit' }}>
                hello@rocketboogie.com
              </a>
            </p>
            <p style={p}>
              We respond to accessibility questions within 2 business days and are committed to making
              reasonable accommodations.
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
