import Nav from '@/components/Nav'

export const metadata = {
  title: 'Upcoming Events | Rocket Boogie Co.',
  description: 'Find us at craft fairs and pop-ups across California.',
}

const events = [
  {
    name: 'Accenture NorCal African American and Asian Pacific American ERG Pop-up Market',
    date: 'Thursday, February 26, 2026',
    location: 'San Francisco, CA',
    notes: null,
  },
]

export default function EventsPage() {
  return (
    <>
      <Nav />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>

        <p style={eyebrow}>Events</p>
        <h1 style={headline}>Upcoming events</h1>
        <p style={{ fontSize: '0.95rem', opacity: 0.55, lineHeight: 1.7, margin: '1rem 0 3rem', maxWidth: 520 }}>
          We love meeting customers in person! Find us at craft fairs and pop-ups throughout
          California. Dates and locations are subject to change, so follow us on Instagram for
          the latest updates.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {events.map((event, i) => (
            <div
              key={event.name}
              style={{
                borderTop: '1px solid var(--border)',
                padding: '1.75rem 0',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '1rem',
                alignItems: 'start',
                ...(i === events.length - 1 ? { borderBottom: '1px solid var(--border)' } : {}),
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.15rem',
                    fontWeight: 400,
                    letterSpacing: '-0.01em',
                    margin: '0 0 0.375rem',
                  }}
                >
                  {event.name}
                </p>
                <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.55, lineHeight: 1.6 }}>
                  {event.location}
                  {event.notes && (
                    <span style={{ opacity: 0.7 }}> · {event.notes}</span>
                  )}
                </p>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  opacity: 0.6,
                  whiteSpace: 'nowrap',
                  textAlign: 'right',
                }}
              >
                {event.date}
              </p>
            </div>
          ))}
        </div>

        <p style={{ marginTop: '3rem', fontSize: '0.875rem', opacity: 0.45 }}>
          More events to be announced. Check back soon!
        </p>

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
