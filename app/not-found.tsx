import Link from 'next/link'
import Image from 'next/image'
import Nav from '@/components/Nav'

const RW = 130
const RH = 168
const FLAME_BOTTOM = 5

export default function NotFound() {
  return (
    <>
      <Nav />
      <main>
        <style>{`
          @keyframes nf-bob {
            0%, 100% { transform: translateY(0); }
            50%       { transform: translateY(-10px); }
          }
          @keyframes nf-ring-spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          @keyframes nf-f-outer {
            0%,100% { transform: scaleX(1.00) scaleY(1.00); }
            18%     { transform: scaleX(0.86) scaleY(1.15); }
            38%     { transform: scaleX(1.08) scaleY(0.91); }
            58%     { transform: scaleX(0.90) scaleY(1.11); }
            78%     { transform: scaleX(1.06) scaleY(0.93); }
          }
          @keyframes nf-f-mid {
            0%,100% { transform: scaleX(1.00) scaleY(1.00); }
            25%     { transform: scaleX(0.74) scaleY(1.28); }
            75%     { transform: scaleX(1.22) scaleY(0.80); }
          }
          @keyframes nf-f-core {
            0%,100% { opacity: 0.95; }
            50%     { opacity: 1.00; }
          }
          @keyframes nf-fade-up {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }

          .nf-rocket-wrap {
            position: relative;
            width: ${RW}px;
            height: ${RH}px;
            animation: nf-bob 3.2s ease-in-out infinite;
          }
          .nf-ring {
            position: absolute;
            top: -47px;
            left: -50px;
            width: 230px;
            height: 230px;
            pointer-events: none;
            transform-origin: center center;
            animation: nf-ring-spin 18s linear infinite;
          }
          .nf-flame-wrap {
            position: absolute;
            bottom: ${FLAME_BOTTOM}px;
            left: 50%;
            transform: translateX(-50%) scaleY(0.28);
            transform-origin: top center;
            opacity: 0.45;
            width: 18px;
            height: 34px;
          }
          .nf-f {
            position: absolute;
            left: 50%;
            top: 0;
            transform-origin: top center;
            border-radius: 50% 50% 58% 58%;
          }
          .nf-f-outer {
            width: 18px; height: 34px; margin-left: -9px;
            background: radial-gradient(ellipse 56% 100% at 50% 0%,
              #ffb07a 0%, #ff8c6a 48%, rgba(255,130,90,0) 100%);
            animation: nf-f-outer 0.20s ease-in-out infinite;
          }
          .nf-f-mid {
            width: 11px; height: 24px; margin-left: -6px;
            background: radial-gradient(ellipse 56% 100% at 50% 0%,
              #ffe87a 0%, #ffc865 62%, transparent 100%);
            animation: nf-f-mid 0.14s ease-in-out infinite;
          }
          .nf-f-core {
            width: 4px; height: 15px; margin-left: -2px;
            background: radial-gradient(ellipse 60% 100% at 50% 0%,
              #ffffff 0%, #fff8cc 52%, transparent 100%);
            animation: nf-f-core 0.10s ease-in-out infinite;
          }

          .nf-content {
            animation: nf-fade-up 0.5s ease both;
          }
          .nf-content-delayed {
            animation: nf-fade-up 0.5s 0.1s ease both;
          }
          .nf-content-delayed-2 {
            animation: nf-fade-up 0.5s 0.2s ease both;
          }
        `}</style>

        <section
          style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '5rem 1.5rem',
            textAlign: 'center',
          }}
        >

          {/* ── Rocket ── */}
          <div className="nf-rocket-wrap" style={{ marginBottom: '2.75rem' }}>

            {/* Spinning ring */}
            <div className="nf-ring" aria-hidden="true">
              <svg width="230" height="230" viewBox="0 0 230 230" overflow="visible">
                <defs>
                  <path id="nf-ring-path" d="M 115,115 m -92,0 a 92,92 0 1,1 184,0 a 92,92 0 1,1 -184,0" />
                </defs>
                <text fill="#bf2d18" fontSize="12.5" fontFamily="var(--font-sans, sans-serif)" fontWeight="900" style={{ opacity: 0.5 }}>
                  <textPath href="#nf-ring-path" startOffset="2%" textLength="578" lengthAdjust="spacing">
                    {'DESIGNED TO MAKE YOU SMILE •'}
                  </textPath>
                </text>
              </svg>
            </div>

            {/* Flame */}
            <div className="nf-flame-wrap" aria-hidden="true">
              <div className="nf-f nf-f-outer" />
              <div className="nf-f nf-f-mid" />
              <div className="nf-f nf-f-core" />
            </div>

            <Image
              src="/rbc-milo.png"
              alt=""
              width={RW}
              height={RH}
              style={{ display: 'block', position: 'relative', zIndex: 1 }}
            />
          </div>

          {/* ── Label ── */}
          <p
            className="nf-content"
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              opacity: 0.32,
              margin: '0 0 0.75rem',
            }}
          >
            Error 404
          </p>

          {/* ── Headline ── */}
          <h1
            className="nf-content"
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2rem, 5vw, 3.25rem)',
              fontWeight: 400,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              margin: '0 0 1.1rem',
            }}
          >
            Houston, we lost this page.
          </h1>

          {/* ── Tagline ── */}
          <p
            className="nf-content-delayed"
            style={{
              fontSize: '0.9rem',
              opacity: 0.48,
              lineHeight: 1.7,
              margin: '0 0 2.5rem',
              maxWidth: 360,
            }}
          >
            Handpainted art designed to make you smile,<br />made with love in San Francisco.
          </p>

          {/* ── CTA ── */}
          <Link
            href="/shop"
            className="nf-content-delayed-2 hover:opacity-80"
            style={{
              background: 'var(--accent)',
              border: '1.5px solid var(--accent-border)',
              color: 'var(--foreground)',
              padding: '0.875rem 1.75rem',
              borderRadius: '0.625rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'opacity 0.15s',
            }}
          >
            Back to Shop
          </Link>

        </section>
      </main>
    </>
  )
}
