import Link from 'next/link'
import Nav from '@/components/Nav'

export const metadata = {
  title: 'FAQ | Rocket Boogie Co.',
  description: 'Answers to common questions about orders, shipping, and returns.',
}

type FaqItem = { q: string; a: string | React.ReactNode; emailLink?: boolean }
type FaqSection = { heading: string; items: FaqItem[] }

const sections: FaqSection[] = [
  {
    heading: 'General',
    items: [
      {
        q: 'Do you sell in-person?',
        a: <>Yes! We often try to have a booth at local craft fairs and events throughout California. Check out our <Link href="/events" style={{ color: 'inherit' }}>Upcoming Events</Link> page to see where we might pop-up next.</>,
      },
      {
        q: 'How did you come up with "Rocket Boogie" for your name?',
        a: 'We wanted a name that felt as joyful and energetic as our designs. Rocket Boogie just makes you want to smile.',
      },
      {
        q: 'Where are your products manufactured?',
        a: 'We love the hands-on approach. Most of our products are crafted right in our studio. From printing each art piece to cutting and laminating every sticker, we handle the details ourselves to ensure quality and care in every order. Our greeting cards are printed, scored, and packaged by hand. The only items we currently source are our gift wrap, journals, and tote bags, though we\'re excited to be adding our own heat-pressed totes to the lineup soon!',
      },
    ],
  },
  {
    heading: 'Shipping',
    items: [
      {
        q: 'How long will it take to get my order?',
        a: 'Shipping times vary based on the destination and shipping method. Most domestic (US) orders will take 5–7 business days to arrive. Overseas deliveries can take 7 days or more. Please note that delivery times do not include processing time for us to put your order together.',
      },
      {
        q: 'Do you ship overseas?',
        a: 'Yes, we ship all over the world! Shipping costs will apply and be added at checkout. Please note that you are responsible for any import fees at customs when orders arrive at your country.',
      },
      {
        q: 'Can I pick up my order in person?',
        a: 'We offer pickups at our in-person events based on availability. Contact us before ordering for pickup. Otherwise, we have fast, low-rate shipping options for local destinations.',
      },
    ],
  },
  {
    heading: 'Returns, Exchanges & Cancellations',
    items: [
      {
        q: 'Can I cancel my order?',
        a: 'We allow for cancellation of orders within 24 hours of placing the order if the order has not yet shipped. Orders that have already shipped cannot be cancelled. If you\'d like to cancel your order, please email us immediately with your order number to request a cancellation.',
        emailLink: true,
      },
      {
        q: 'Can I make a return?',
        a: 'Unfortunately, we are not able to accept returns for any items at this time unless an item has arrived damaged. If you\'d like to make a return for a damaged item, please contact us within 7 days of receiving your order with your order number and photo evidence of the damaged item.',
        emailLink: true,
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <>
      <Nav />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>

        <p style={eyebrow}>FAQ</p>
        <h1 style={headline}>Frequently asked questions</h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', marginTop: '3rem' }}>
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 style={sectionHeading}>{section.heading}</h2>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {section.items.map((item, i) => (
                  <div
                    key={item.q}
                    style={{
                      borderTop: '1px solid var(--border)',
                      padding: '1.5rem 0',
                      ...(i === section.items.length - 1 ? { borderBottom: '1px solid var(--border)' } : {}),
                    }}
                  >
                    <p style={question}>{item.q}</p>
                    <p style={answer}>
                      {item.a}
                      {item.emailLink && (
                        <>
                          {' '}
                          <a href="mailto:hello@rocketboogie.com" style={{ color: 'inherit' }}>
                            hello@rocketboogie.com
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div style={{ marginTop: '4rem', paddingTop: '2.5rem', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.95rem', opacity: 0.6, margin: '0 0 0.5rem' }}>
            Still have questions?
          </p>
          <a
            href="mailto:hello@rocketboogie.com"
            style={{
              fontSize: '0.95rem',
              fontWeight: 600,
              color: 'inherit',
            }}
          >
            hello@rocketboogie.com
          </a>
        </div>

      </main>
    </>
  )
}

const eyebrow: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  opacity: 0.4,
  margin: '0 0 1rem',
}

const headline: React.CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontSize: 'clamp(2rem, 4vw, 2.75rem)',
  fontWeight: 400,
  letterSpacing: '-0.02em',
  margin: 0,
}

const sectionHeading: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  opacity: 0.4,
  margin: '0 0 0.25rem',
}

const question: React.CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontSize: '1.1rem',
  fontWeight: 400,
  letterSpacing: '-0.01em',
  margin: '0 0 0.625rem',
}

const answer: React.CSSProperties = {
  fontSize: '0.925rem',
  lineHeight: 1.75,
  opacity: 0.7,
  margin: 0,
}
