import Nav from '@/components/Nav'
import ContactForm from './ContactForm'

export const metadata = {
  title: 'Contact | Rocket Boogie Co.',
  description: 'Get in touch with questions about orders, wholesale, or anything else.',
}

export default function ContactPage() {
  return (
    <>
      <Nav />
      <main style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(3rem, 8vw, 5rem) 1.5rem 6rem' }}>

        <p
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            opacity: 0.4,
            margin: '0 0 1.25rem',
          }}
        >
          Get in touch
        </p>

        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2rem, 5vw, 3.25rem)',
            fontWeight: 400,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            margin: '0 0 1rem',
          }}
        >
          We&apos;d love to hear from you.
        </h1>

        <p
          style={{
            fontSize: '0.95rem',
            opacity: 0.6,
            lineHeight: 1.75,
            margin: '0 0 3rem',
            maxWidth: 520,
          }}
        >
          Questions about an order, wholesale inquiries, event collaborations — drop us a note
          and we&apos;ll get back to you within 1–2 business days.
        </p>

        <ContactForm />

        <p
          style={{
            marginTop: '2.5rem',
            fontSize: '0.85rem',
            opacity: 0.45,
          }}
        >
          Prefer email?{' '}
          <a
            href="mailto:hello@rocketboogie.com"
            style={{ color: 'var(--foreground)', textDecoration: 'underline' }}
          >
            hello@rocketboogie.com
          </a>
        </p>

      </main>
    </>
  )
}
