import Nav from '@/components/Nav'

export const metadata = {
  title: 'Events | Rocket Boogie Co.',
  description: 'Find us at craft fairs and pop-ups across California.',
}

type Event = {
  name: string
  date: string
  isoDate: string
  location: string
  notes: string | null
}

const events: Event[] = [
  {
    name: 'Accenture NorCal African American and Asian Pacific American ERG Pop-up Market',
    date: 'Thursday, February 26, 2026',
    isoDate: '2026-02-26',
    location: 'San Francisco, CA',
    notes: null,
  },
]

function groupByYear(evts: Event[]): Record<number, Event[]> {
  return evts.reduce<Record<number, Event[]>>((acc, e) => {
    const year = new Date(e.isoDate).getFullYear()
    ;(acc[year] ??= []).push(e)
    return acc
  }, {})
}

function EventRow({ event, last }: { event: Event; last: boolean }) {
  return (
    <div
      style={{
        borderTop: '1px solid var(--border)',
        padding: '1.75rem 0',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '1rem',
        alignItems: 'start',
        ...(last ? { borderBottom: '1px solid var(--border)' } : {}),
      }}
    >
      <div>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 400, letterSpacing: '-0.01em', margin: '0 0 0.375rem' }}>
          {event.name}
        </p>
        <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.55, lineHeight: 1.6 }}>
          {event.location}
          {event.notes && <span> · {event.notes}</span>}
        </p>
      </div>
      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 500, opacity: 0.6, whiteSpace: 'nowrap', textAlign: 'right' }}>
        {event.date}
      </p>
    </div>
  )
}

export default function EventsPage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcoming = events.filter(e => new Date(e.isoDate) >= today)
  const past = events.filter(e => new Date(e.isoDate) < today)
  const pastByYear = groupByYear(past)
  const pastYears = Object.keys(pastByYear).map(Number).sort((a, b) => b - a)

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

        {upcoming.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {upcoming.map((event, i) => (
              <EventRow key={event.isoDate} event={event} last={i === upcoming.length - 1} />
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '0.95rem', opacity: 0.45, fontStyle: 'italic' }}>
            More events to be announced. Check back soon!
          </p>
        )}

        {pastYears.length > 0 && (
          <div style={{ marginTop: '4rem' }}>
            {pastYears.map(year => (
              <div key={year} style={{ marginBottom: '3rem' }}>
                <p style={sectionLabel}>{year} — Past Events</p>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {pastByYear[year].map((event, i) => (
                    <EventRow key={event.isoDate} event={event} last={i === pastByYear[year].length - 1} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

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

const sectionLabel: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  opacity: 0.35,
  margin: '0 0 0.25rem',
}
