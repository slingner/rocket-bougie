'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'

// Phase 1 (0 → PEAK):      rocket builds thrust and grows toward viewer
// Phase 2 (PEAK → END):    rocket fires and shoots away into the sky
const PEAK = 220
const END  = 580

// Within the 200×255px image, the exhaust nozzle sits ~175px from the top.
// Flame container top should align there: bottom = 255 - 175 - 68 = 12px
const FLAME_BOTTOM = 12

// Deterministic star positions — avoids SSR/hydration mismatch
function rand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

const STARS = Array.from({ length: 65 }, (_, i) => ({
  x:        rand(i * 3 + 0) * 100,
  y:        rand(i * 3 + 1) * 86,
  size:     0.9 + rand(i * 3 + 2) * 1.8,
  opacity:  0.3 + rand(i * 7 + 3) * 0.62,
  delay:    rand(i * 5 + 4) * 5,
  duration: 2.0 + rand(i * 4 + 5) * 3.2,
  warm:     i % 6 === 0,
}))

const SPARKLES = [
  { x: 11, y: 11, size: 7,   delay: 0.0, duration: 3.2 },
  { x: 79, y: 20, size: 6,   delay: 1.1, duration: 2.8 },
  { x: 45, y: 6,  size: 8,   delay: 0.4, duration: 3.8 },
  { x: 87, y: 54, size: 5.5, delay: 1.8, duration: 2.5 },
  { x: 24, y: 66, size: 5,   delay: 0.9, duration: 3.5 },
  { x: 62, y: 13, size: 6.5, delay: 2.2, duration: 2.9 },
  { x: 34, y: 40, size: 5,   delay: 1.5, duration: 3.1 },
]

export default function RocketHero() {
  const rocketRef = useRef<HTMLDivElement>(null)
  const flameRef  = useRef<HTMLDivElement>(null)
  const skyRef    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let ticking = false

    function update() {
      if (!rocketRef.current || !flameRef.current || !skyRef.current) { ticking = false; return }
      const scrollY = window.scrollY

      let scale:        number
      let ty:           number
      let opacity:      number
      let wobble:       number
      let flameScaleY:  number
      let flameOpacity: number
      let skyTy:        number

      if (scrollY <= PEAK) {
        const t  = scrollY / PEAK
        const t2 = t * t   // ease-in: slow build

        // Rocket slowly grows toward viewer as thrust builds
        scale        = 1 + 0.52 * t2
        ty           = 0
        opacity      = 1
        // Pre-launch vibration — rocket trembles on the pad
        wobble       = scrollY < 120 ? Math.sin(scrollY * 1.4) * 2 * Math.min(1, scrollY / 60) : 0
        // Flame ignites and grows
        flameOpacity = Math.min(1, scrollY / 55)
        flameScaleY  = 0.35 + 0.65 * t
        // Sky is stationary during thrust build
        skyTy        = 0

      } else {
        const t  = Math.min(1, (scrollY - PEAK) / (END - PEAK))
        const t2 = t * t   // ease-in: slow start, then rockets away

        // Quadratic departure: starts sluggish, then accelerates hard
        scale        = 1.52 - 1.50 * t2
        ty           = -820 * t2
        opacity      = t < 0.80 ? 1 : 1 - (t - 0.80) / 0.20
        wobble       = 0
        // Flame elongates at full throttle, then vanishes as rocket disappears
        flameScaleY  = 1.0 + 2.0 * t
        flameOpacity = Math.max(0, 1 - t2 * 2.2)
        // Sky rises as rocket departs — 20% of its own height (panel is 125% tall)
        skyTy        = -20 * t2
      }

      rocketRef.current.style.transform =
        `translateX(-50%) translateY(${ty}px) scale(${scale}) rotate(${wobble}deg)`
      rocketRef.current.style.opacity  = String(opacity)

      flameRef.current.style.transform = `translateX(-50%) scaleY(${flameScaleY})`
      flameRef.current.style.opacity   = String(Math.max(0, flameOpacity))

      skyRef.current.style.transform   = `translateY(${skyTy}%)`

      ticking = false
    }

    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update) }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section style={{
      position: 'relative',
      minHeight: '72vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: 'clamp(3.5rem, 8vw, 5.5rem) 1.5rem 0',
      overflow: 'visible',
    }}>
      <style>{`
        /* ── Flame animations ── */
        @keyframes rh-f-outer {
          0%,100% { transform: scaleX(1.00) scaleY(1.00); }
          18%     { transform: scaleX(0.86) scaleY(1.15); }
          38%     { transform: scaleX(1.08) scaleY(0.91); }
          58%     { transform: scaleX(0.90) scaleY(1.11); }
          78%     { transform: scaleX(1.06) scaleY(0.93); }
        }
        @keyframes rh-f-mid {
          0%,100% { transform: scaleX(1.00) scaleY(1.00); }
          25%     { transform: scaleX(0.74) scaleY(1.28); }
          75%     { transform: scaleX(1.22) scaleY(0.80); }
        }
        @keyframes rh-f-core {
          0%,100% { opacity: 0.95; }
          50%     { opacity: 1.00; }
        }

        .rh-f {
          position: absolute;
          left: 50%;
          top: 0;
          transform-origin: top center;
          border-radius: 50% 50% 58% 58%;
        }
        .rh-f-outer {
          width: 36px; height: 70px; margin-left: -18px;
          background: radial-gradient(ellipse 56% 100% at 50% 0%,
            #ffb07a 0%, #ff8c6a 48%, rgba(255,130,90,0) 100%);
          animation: rh-f-outer 0.20s ease-in-out infinite;
        }
        .rh-f-mid {
          width: 21px; height: 52px; margin-left: -10.5px;
          background: radial-gradient(ellipse 56% 100% at 50% 0%,
            #ffe87a 0%, #ffc865 62%, transparent 100%);
          animation: rh-f-mid 0.14s ease-in-out infinite;
        }
        .rh-f-core {
          width: 9px; height: 30px; margin-left: -4.5px;
          background: radial-gradient(ellipse 60% 100% at 50% 0%,
            #ffffff 0%, #fff8cc 52%, transparent 100%);
          animation: rh-f-core 0.10s ease-in-out infinite;
        }

        /* ── Sky ── */

        /* Clip wrapper — confines sky to section bounds, lets rocket overflow freely */
        .rh-sky-clip {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
        }

        /* Sky panel — 125% tall so upward translate never shows a gap */
        .rh-sky {
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          height: 125%;
          will-change: transform;
          /* Deep indigo → cobalt → violet → warm amber glow → transparent cream */
          background: linear-gradient(
            to bottom,
            #0d1054 0%,
            #1b2b80 25%,
            #2e44a0 47%,
            #5a4a8a 64%,
            rgba(210, 155, 55, 0.5) 80%,
            rgba(250, 249, 246, 0) 100%
          );
        }

        /* Subtle launch-pad glow at the base of the sky */
        .rh-sky::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 320px;
          height: 180px;
          background: radial-gradient(ellipse at 50% 100%,
            rgba(234, 162, 33, 0.22) 0%, transparent 72%);
          pointer-events: none;
        }

        .rh-moon {
          position: absolute;
          top: 11%;
          right: 17%;
          filter: drop-shadow(0 0 10px rgba(245, 228, 138, 0.5))
                  drop-shadow(0 0 24px rgba(245, 228, 138, 0.2));
          z-index: 5;
        }

        /* ── Star animations ── */
        @keyframes rh-twinkle {
          0%, 100% { opacity: var(--star-op, 0.5); }
          50%      { opacity: calc(var(--star-op, 0.5) * 0.22); }
        }
        @keyframes rh-sparkle {
          0%, 100% { transform: scale(1) rotate(0deg);    opacity: 0.82; }
          30%      { transform: scale(1.45) rotate(18deg); opacity: 1;    }
          70%      { transform: scale(0.78) rotate(-12deg); opacity: 0.5; }
        }

        .rh-star {
          position: absolute;
          border-radius: 50%;
          z-index: 5;
          animation: rh-twinkle var(--star-dur, 2.5s) ease-in-out infinite;
          animation-delay: var(--star-delay, 0s);
        }
        .rh-sparkle {
          position: absolute;
          z-index: 5;
          animation: rh-sparkle var(--spark-dur, 3s) ease-in-out infinite;
          animation-delay: var(--spark-delay, 0s);
        }

        /* ── Sky waves ── */
        .rh-wave {
          position: absolute;
          left: 0; right: 0;
          width: 100%;
          display: block;
          pointer-events: none;
          z-index: 10;
        }
        .rh-wave-top { top: 0; }
        .rh-wave-bot { bottom: 0; }
      `}</style>

      {/* Night sky — clipped to section, parallaxes upward when rocket launches */}
      <div className="rh-sky-clip" aria-hidden="true">
        <div ref={skyRef} className="rh-sky">

          {/* SVG crescent moon with crater details */}
          <div className="rh-moon">
            <svg viewBox="0 0 64 64" width="54" height="54" aria-hidden="true">
              <defs>
                <mask id="rh-crescent-mask">
                  <rect width="64" height="64" fill="white" />
                  {/* Offset circle that "cuts" the crescent shape */}
                  <circle cx="40" cy="24" r="21" fill="black" />
                </mask>
              </defs>
              {/* Moon body */}
              <circle cx="28" cy="32" r="21" fill="#f5e48a" mask="url(#rh-crescent-mask)" />
              {/* Subtle craters */}
              <circle cx="18" cy="38" r="3.5" fill="rgba(185,145,42,0.28)" mask="url(#rh-crescent-mask)" />
              <circle cx="27" cy="23" r="2.4" fill="rgba(185,145,42,0.22)" mask="url(#rh-crescent-mask)" />
              <circle cx="13" cy="25" r="1.8" fill="rgba(185,145,42,0.18)" mask="url(#rh-crescent-mask)" />
              <circle cx="23" cy="44" r="2.0" fill="rgba(185,145,42,0.20)" mask="url(#rh-crescent-mask)" />
              {/* Subtle highlight — slightly lighter arc near the lit limb */}
              <circle cx="14" cy="20" r="8" fill="rgba(255,248,200,0.12)" mask="url(#rh-crescent-mask)" />
            </svg>
          </div>

          {/* Round twinkling stars */}
          {STARS.map((s, i) => (
            <div
              key={i}
              className="rh-star"
              style={{
                left:    `${s.x}%`,
                top:     `${s.y}%`,
                width:   s.size,
                height:  s.size,
                background: s.warm ? '#f5d98a' : '#d8e8ff',
                opacity: s.opacity,
                '--star-op':    s.opacity,
                '--star-delay': `${s.delay}s`,
                '--star-dur':   `${s.duration}s`,
              } as React.CSSProperties}
            />
          ))}

          {/* 4-point sparkle stars */}
          {SPARKLES.map((s, i) => (
            <div
              key={i}
              className="rh-sparkle"
              style={{
                left: `${s.x}%`,
                top:  `${s.y}%`,
                '--spark-delay': `${s.delay}s`,
                '--spark-dur':   `${s.duration}s`,
              } as React.CSSProperties}
            >
              <svg viewBox="0 0 10 10" width={s.size} height={s.size}>
                <path
                  d="M5 0 L6.3 3.7 L10 5 L6.3 6.3 L5 10 L3.7 6.3 L0 5 L3.7 3.7 Z"
                  fill={i % 3 === 0 ? '#f5e48a' : '#c8d8ff'}
                />
              </svg>
            </div>
          ))}

          {/* Top wave — wavy upper boundary of sky */}
          <svg
            className="rh-wave rh-wave-top"
            viewBox="0 0 1440 56"
            preserveAspectRatio="none"
            height="56"
            aria-hidden="true"
          >
            <path
              d="M0,0 L1440,0 L1440,44 C1200,28 960,52 720,36 C480,20 240,48 0,36 Z"
              fill="#faf9f6"
            />
          </svg>

          {/* Bottom wave — wavy lower boundary of sky */}
          <svg
            className="rh-wave rh-wave-bot"
            viewBox="0 0 1440 56"
            preserveAspectRatio="none"
            height="56"
            aria-hidden="true"
          >
            <path
              d="M0,56 L1440,56 L1440,12 C1200,28 960,4 720,20 C480,36 240,8 0,18 Z"
              fill="#faf9f6"
            />
          </svg>

        </div>
      </div>

      {/* H1 heading — rendered over the sky */}
      <h1 style={{
        position: 'relative',
        zIndex: 1,
        fontFamily: 'var(--font-serif)',
        fontSize: 'clamp(2.25rem, 6vw, 4rem)',
        fontWeight: 400,
        letterSpacing: '-0.02em',
        lineHeight: 1.1,
        color: 'rgba(255, 255, 255, 0.92)',
        margin: 0,
        textAlign: 'center',
      }}>
        About Rocket Boogie Co.
      </h1>

      {/* Rocket — anchored to bottom, launches on scroll */}
      <div
        ref={rocketRef}
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          transformOrigin: 'bottom center',
          willChange: 'transform, opacity',
          zIndex: 2,
        }}
      >
        {/* Flame plume — behind rocket image, at exhaust nozzle */}
        <div
          ref={flameRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: FLAME_BOTTOM,
            left: '50%',
            transform: 'translateX(-50%) scaleY(0)',
            transformOrigin: 'top center',
            opacity: 0,
            width: 36,
            height: 70,
            zIndex: 0,
            pointerEvents: 'none',
            willChange: 'transform, opacity',
          }}
        >
          <div className="rh-f rh-f-outer" />
          <div className="rh-f rh-f-mid" />
          <div className="rh-f rh-f-core" />
        </div>

        <Image
          src="/rbc-milo.png"
          alt="Milo the space cat launching"
          width={200}
          height={255}
          priority
          style={{ display: 'block', position: 'relative', zIndex: 1 }}
        />
      </div>
    </section>
  )
}
