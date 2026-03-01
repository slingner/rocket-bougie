import Image from 'next/image'
import Link from 'next/link'
import Nav from '@/components/Nav'

export const metadata = {
  title: 'About Us | Rocket Boogie Co.',
  description: 'Scott and Tammy create joyful art from a dining table in San Francisco.',
}

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main>

        {/* Hero */}
        <section
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            padding: 'clamp(3rem, 8vw, 6rem) 1.5rem clamp(2rem, 4vw, 4rem)',
          }}
        >
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
            About us
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2.25rem, 5vw, 4rem)',
              fontWeight: 400,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              margin: '0 0 2rem',
              maxWidth: 800,
            }}
          >
            We believe the little things can turn an ordinary day into something that makes you smile.
          </h1>
          <p
            style={{
              fontSize: '1rem',
              opacity: 0.6,
              lineHeight: 1.75,
              maxWidth: 600,
              margin: 0,
            }}
          >
            Rocket Boogie Co. started with a question: <em>&quot;Will this make someone smile?&quot;</em> That
            question still guides every design we make.
          </p>
        </section>

        {/* Booth photo */}
        <section style={{ background: 'var(--muted)', padding: 'clamp(3rem, 6vw, 5rem) 1.5rem' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <Image
              src="/about-booth.jpg"
              alt="Scott and Tammy at a Rocket Boogie Co. market booth"
              width={1400}
              height={933}
              style={{ width: '100%', height: 'auto', borderRadius: '1rem', display: 'block' }}
              priority
            />
          </div>
        </section>

        {/* Process */}
        <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 1.5rem' }}>
          <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                margin: '0 0 1.25rem',
              }}
            >
              Made at the dining table
            </h2>
            <p style={{ fontSize: '0.95rem', opacity: 0.6, lineHeight: 1.75, margin: '0 0 1rem' }}>
              Everything starts at our dining table where we pass watercolor and gouache designs back and forth until they become something we hope brings a little joy to your day.
            </p>
            <p style={{ fontSize: '0.95rem', opacity: 0.6, lineHeight: 1.75, margin: '0 0 2.5rem' }}>
              We print many of our products in our studio. Our work has spread across the
              country through craft fairs, coffee shops, and boutiques, and now right here.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
                letterSpacing: '-0.01em',
                opacity: 0.8,
                fontStyle: 'italic',
                margin: '0 0 2.5rem',
              }}
            >
              &ldquo;Life&apos;s too short for boring walls and generic gifts.&rdquo;
            </p>
            <Link
              href="/shop"
              style={{
                background: 'var(--accent)',
                color: 'var(--foreground)',
                padding: '0.875rem 2rem',
                borderRadius: '100px',
                fontSize: '0.95rem',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-block',
                transition: 'opacity 0.15s',
              }}
              className="hover:opacity-80"
            >
              Shop our work
            </Link>
          </div>
        </section>

      </main>
    </>
  )
}
