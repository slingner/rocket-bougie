import Image from 'next/image'
import Link from 'next/link'
import Nav from '@/components/Nav'
import RocketHero from '@/components/RocketHero'

export const metadata = {
  title: 'About Us | Rocket Boogie Co.',
  description: 'Scott and Tammy create original watercolor and gouache art in San Francisco.',
}

export default function AboutPage() {
  const years = new Date().getFullYear() - 2014;
  const yearsText = `${years} ${years === 1 ? 'year' : 'years'}`;
  return (
    <>
      <Nav />
      <main style={{ overflowX: 'hidden' }}>
        <style>{`
          .ab-eyebrow {
            font-size: 0.68rem;
            font-weight: 600;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            opacity: 0.3;
            margin: 0 0 1.75rem;
          }

          /* ── Full image ── */
          .ab-image-section {
            padding: clamp(2rem, 4vw, 3.5rem) 1.5rem;
            max-width: 1280px;
            margin: 0 auto;
          }
          .ab-booth-img {
            width: 100%;
            height: auto;
            border-radius: 1.125rem;
            display: block;
          }
          .ab-booth-caption {
            font-size: 0.7rem;
            opacity: 0.3;
            margin: 0.75rem 0 0;
            letter-spacing: 0.03em;
          }

          /* ── Story ── */
          .ab-story {
            background: var(--foreground);
            color: var(--background);
            padding: clamp(4.5rem, 9vw, 8rem) 1.5rem;
          }
          .ab-story-inner {
            max-width: 1100px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: clamp(3rem, 7vw, 7rem);
            align-items: start;
          }
          .ab-accent-bar {
            width: 36px;
            height: 2.5px;
            background: var(--accent);
            border-radius: 2px;
            margin-bottom: 1.5rem;
          }
          .ab-story-h2 {
            font-family: var(--font-serif);
            font-size: clamp(2rem, 4.5vw, 3.5rem);
            font-weight: 400;
            line-height: 1.12;
            letter-spacing: -0.025em;
            margin: 0;
          }
          .ab-story-right p {
            font-size: 1rem;
            line-height: 1.9;
            opacity: 0.62;
            margin: 0 0 1.25rem;
          }
          .ab-story-right p:last-child { margin-bottom: 0; }

          @media (max-width: 680px) {
            .ab-story-inner { grid-template-columns: 1fr; }
          }

          /* ── Team ── */
          .ab-team {
            padding: clamp(4.5rem, 9vw, 8rem) 1.5rem;
          }
          .ab-team-inner {
            max-width: 1100px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 5fr 7fr;
            gap: clamp(3rem, 6vw, 6rem);
            align-items: center;
          }
          .ab-team-portrait-wrap {
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--muted);
            border: 1px solid var(--border);
            border-radius: 1.75rem;
            padding: clamp(1.75rem, 4vw, 2.75rem) clamp(1.25rem, 3vw, 2rem);
          }
          .ab-team-portrait-img {
            width: 100%;
            max-width: 300px;
            height: auto;
            display: block;
            margin: 0 auto;
          }
          .ab-team-h2 {
            font-family: var(--font-serif);
            font-size: clamp(2rem, 4.5vw, 3.25rem);
            font-weight: 400;
            letter-spacing: -0.025em;
            margin: 0.5rem 0 1.25rem;
          }
          .ab-team-body {
            font-size: 1rem;
            line-height: 1.9;
            opacity: 0.55;
            margin: 0;
          }

          @media (max-width: 680px) {
            .ab-team-inner { grid-template-columns: 1fr; }
          }

          /* ── Callout ── */
          .ab-callout {
            background: var(--accent);
            padding: clamp(4.5rem, 9vw, 7rem) 1.5rem;
          }
          .ab-callout-inner {
            max-width: 860px;
            margin: 0 auto;
            text-align: center;
          }
          .ab-callout-quote {
            font-family: var(--font-serif);
            font-size: clamp(1.85rem, 5vw, 3.5rem);
            font-weight: 400;
            line-height: 1.2;
            letter-spacing: -0.025em;
            margin: 0 0 1.5rem;
            color: var(--foreground);
          }
          .ab-callout-inner p {
            font-size: 1rem;
            line-height: 1.8;
            max-width: 520px;
            margin: 0 auto;
            opacity: 0.65;
          }

          /* ── Markets ── */
          .ab-markets {
            padding: clamp(4.5rem, 9vw, 8rem) 1.5rem;
            border-top: 1px solid var(--border);
          }
          .ab-markets-inner {
            max-width: 1100px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: clamp(2.5rem, 6vw, 6rem);
            align-items: center;
          }
          .ab-markets-h2 {
            font-family: var(--font-serif);
            font-size: clamp(2rem, 4vw, 3rem);
            font-weight: 400;
            letter-spacing: -0.025em;
            margin: 0.5rem 0 1.25rem;
          }
          .ab-markets-body {
            font-size: 1rem;
            line-height: 1.85;
            opacity: 0.52;
            margin: 0;
          }
          .ab-markets-right {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.875rem;
          }
          .ab-market-chip {
            background: var(--muted);
            border: 1px solid var(--border);
            border-radius: 0.75rem;
            padding: 1.25rem 1rem;
            font-size: 0.8rem;
            font-weight: 600;
            letter-spacing: 0.02em;
            line-height: 1.4;
          }
          .ab-market-chip span {
            display: block;
            font-size: 0.7rem;
            font-weight: 400;
            opacity: 0.5;
            margin-top: 0.2rem;
            letter-spacing: 0;
          }

          /* Faire chip — link hover */
          a.ab-market-chip {
            display: block;
            color: var(--foreground);
            text-decoration: none;
            position: relative;
            transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s, background 0.2s;
          }
          a.ab-market-chip::after {
            content: '↗';
            position: absolute;
            top: 0.75rem;
            right: 0.875rem;
            font-size: 0.6rem;
            letter-spacing: 0;
            color: var(--accent);
            opacity: 0;
            transform: translate(-2px, 2px);
            transition: opacity 0.18s, transform 0.18s;
          }
          a.ab-market-chip:hover {
            border-color: var(--accent);
            background: rgba(255, 170, 170, 0.07);
            transform: translateY(-2px);
            box-shadow: 0 6px 22px rgba(255, 170, 170, 0.18);
          }
          a.ab-market-chip:hover::after {
            opacity: 1;
            transform: translate(0, 0);
          }

          /* Faire inline text link */
          .ab-faire-link {
            color: inherit;
            text-decoration: underline;
            text-decoration-color: var(--accent);
            text-underline-offset: 3px;
            text-decoration-thickness: 1.5px;
            border-radius: 3px;
            padding: 0 2px;
            transition: background 0.15s, text-decoration-color 0.15s;
          }
          .ab-faire-link:hover {
            background: rgba(255, 170, 170, 0.16);
            text-decoration-color: transparent;
          }

          @media (max-width: 700px) {
            .ab-markets-inner { grid-template-columns: 1fr; }
          }

          /* ── CTA ── */
          .ab-cta {
            background: var(--muted);
            border-top: 1px solid var(--border);
            padding: clamp(4rem, 8vw, 6.5rem) 1.5rem;
            text-align: center;
          }
          .ab-cta-inner {
            max-width: 560px;
            margin: 0 auto;
          }
          .ab-cta-h2 {
            font-family: var(--font-serif);
            font-size: clamp(1.75rem, 4vw, 2.75rem);
            font-weight: 400;
            letter-spacing: -0.025em;
            margin: 0 0 0.75rem;
            line-height: 1.2;
          }
          .ab-cta-sub {
            font-size: 0.95rem;
            opacity: 0.45;
            line-height: 1.7;
            margin: 0 0 2.25rem;
          }
          .ab-cta-btn {
            display: inline-block;
            background: var(--foreground);
            color: var(--background);
            padding: 1rem 2.75rem;
            border-radius: 100px;
            font-size: 0.875rem;
            font-weight: 600;
            text-decoration: none;
            letter-spacing: 0.025em;
            transition: opacity 0.15s;
          }
          .ab-cta-btn:hover { opacity: 0.7; }
        `}</style>

        {/* ── Hero (rocket + launch animation) ── */}
        <RocketHero />

        {/* ── Full-width photo ── */}
        <section className="ab-image-section">
          <Image
            src="/about-booth.jpg"
            alt="Scott and Tammy at a Rocket Boogie Co. market booth"
            width={2400}
            height={1600}
            className="ab-booth-img"
            priority
          />
          <p className="ab-booth-caption">
            Scott &amp; Tammy at Accenture&apos;s Lunar New Year Pop-Up Market
          </p>
        </section>

        {/* ── Story ── */}
        <section className="ab-story">
          <div className="ab-story-inner">
            <div>
              <div className="ab-accent-bar" />
              <h2 className="ab-story-h2">
                {yearsText} of making art together.
              </h2>
            </div>
            <div className="ab-story-right">
              <p>
                Rocket Boogie Co. is a small art and stationery studio run by husband and wife Scott and Tammy. Every piece begins with an original painting in gouache or watercolor, then grows into prints, greeting cards, and everyday objects designed to bring a little more joy to the people who own them.
              </p>
              <p>
                We got our start selling at local markets around San Francisco and have been growing steadily since. Seeing people connect with the work in person is something we still look forward to every time.
              </p>
              <p>
                If something makes us smile while making it, it belongs in the shop.
              </p>
            </div>
          </div>
        </section>

        {/* ── Team ── */}
        <section className="ab-team">
          <div className="ab-team-inner">
            <div className="ab-team-portrait-wrap">
              <Image
                src="/scott-tammy.png"
                alt="Illustrated portrait of Scott and Tammy"
                width={780}
                height={780}
                className="ab-team-portrait-img"
              />
            </div>
            <div>
              <p className="ab-eyebrow">The team</p>
              <h2 className="ab-team-h2">Scott and Tammy</h2>
              <p className="ab-team-body">
                Scott and Tammy are a husband and wife creative team based in San Francisco. Scott brings the quirky, fun-loving energy to every piece, dreaming up the playful characters that give Rocket Boogie its personality. Tammy is the heart of the designs, adding beauty, warmth, and the technical artistry that makes each illustration something worth keeping. Together they have spent {yearsText} making art together.
              </p>
            </div>
          </div>
        </section>

       

        {/* ── Markets ── */}
        <section className="ab-markets">
          <div className="ab-markets-inner">
            <div>
              <p className="ab-eyebrow">Find us in person</p>
              <h2 className="ab-markets-h2">Pop-ups and markets</h2>
              <p className="ab-markets-body">
                We sell through our online shop and at events throughout the Bay Area. Wholesale is available through <a href="https://rocketboogieco.faire.com" target="_blank" rel="noopener noreferrer" className="ab-faire-link">Faire</a>.
              </p>
            </div>
            <div className="ab-markets-right">
              <Link href="/events" className="ab-market-chip">
                Bay Area Markets
                <span>Year-round</span>
              </Link>
              <Link href="/contact" className="ab-market-chip">
                Corporate Pop-Ups
                <span>On request</span>
              </Link>
              <Link href="/events" className="ab-market-chip">
                Holiday Shows
                <span>Nov &ndash; Dec</span>
              </Link>
              <a
                className="ab-market-chip"
                href="https://rocketboogieco.faire.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Wholesale via Faire
                <span>Available now</span>
              </a>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="ab-cta">
          <div className="ab-cta-inner">
            <h2 className="ab-cta-h2">Shop the collection</h2>
            <p className="ab-cta-sub">
              Browse original watercolor prints, greeting cards, stickers, and more.
            </p>
            <Link href="/shop" className="ab-cta-btn">
              Shop now
            </Link>
          </div>
        </section>

      </main>
    </>
  )
}
