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
        <section style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: 'clamp(3rem, 8vw, 5.5rem) 1.5rem clamp(2.5rem, 5vw, 4rem)',
        }}>
          <p style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            opacity: 0.35,
            margin: '0 0 1.5rem',
          }}>
            Our story
          </p>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.25rem, 5vw, 3.75rem)',
            fontWeight: 400,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            margin: '0 0 1.75rem',
            maxWidth: 780,
          }}>
              
          </h1>
          <p style={{
            fontSize: '1rem',
            opacity: 0.55,
            lineHeight: 1.8,
            maxWidth: 520,
            margin: 0,
          }}>
            Rocket Boogie Co. started with a question: <em>&ldquo;Will this make someone smile?&rdquo;</em> That question still guides every design we make. 
          </p>
        </section>

        {/* Split — image left, text right */}
        <section style={{ padding: '0 1.5rem clamp(4rem, 8vw, 7rem)' }}>
          <style>{`
            .about-split {
              max-width: 1100px;
              margin: 0 auto;
              display: grid;
              grid-template-columns: 58fr 42fr;
              gap: clamp(2.5rem, 5vw, 5rem);
              align-items: center;
            }
            @media (max-width: 700px) {
              .about-split {
                grid-template-columns: 1fr;
              }
            }
          `}</style>

          <div className="about-split">
            {/* Image */}
            <div style={{ position: 'relative' }}>
              <Image
                src="/about-booth.jpg"
                alt="Scott and Tammy at a Rocket Boogie Co. market booth"
                width={1400}
                height={933}
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '0.875rem',
                  display: 'block',
                }}
                priority
              />
              <p style={{
                margin: '0.875rem 0 0',
                fontSize: '0.75rem',
                opacity: 0.35,
                letterSpacing: '0.02em',
              }}>
                Scott &amp; Tammy at Accenture&apos;s Lunar New Year Pop-Up Market
              </p>
            </div>

            {/* Text */}
            <div>
              <div style={{
                width: 36,
                height: 2,
                background: 'var(--accent)',
                borderRadius: 2,
                marginBottom: '1.75rem',
              }} />
              <h2 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.6rem, 3vw, 2.25rem)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                margin: '0 0 1.25rem',
              }}>
                Bringing a little more joy to your world, one design at a time.
              </h2>
              <p style={{
                fontSize: '0.95rem',
                opacity: 0.55,
                lineHeight: 1.8,
                margin: '0 0 2.25rem',
              }}>
                Every piece in our collection begins with original gouache and watercolor paintings by husband and wife team, Scott &amp; Tammy. Our collection features whimsical characters and fun illustrations to brighten your day.
              </p>
              <Link
                href="/shop"
                style={{
                  background: 'var(--accent)',
                  border: '1.5px solid var(--accent-border)',
                  color: 'var(--foreground)',
                  padding: '0.875rem 2rem',
                  borderRadius: '100px',
                  fontSize: '0.9rem',
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
          </div>
        </section>

      </main>
    </>
  )
}
