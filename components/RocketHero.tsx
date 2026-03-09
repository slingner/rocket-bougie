'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

// Flame dimensions — sized for the 70×90 rocket display (≈ 0.35× original 200×255)
const FLAME_BOTTOM = 4

// Rocket display size
const RW = 70
const RH = 90

// Landing pad — bottom-right corner
const PAD_R = 28   // right inset px
const PAD_B = 28   // bottom inset px
const PAD_W = 54   // 3-D disc SVG width
const PAD_H = 30   // 3-D disc SVG height

// Rocket center hovers just above the disc's top face
function idlePos() {
  return {
    x: window.innerWidth  - PAD_R - PAD_W / 2,
    y: window.innerHeight - PAD_B - PAD_H - RH / 2 - 8,
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   SPACE BACKGROUND — commented out, restore when needed
   ─────────────────────────────────────────────────────────────────────────────

const PEAK = 220
const END  = 580
const ORIGINAL_FLAME_BOTTOM = 12

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

interface ShootingStar {
  id: number
  x: number; y: number; length: number; dist: number; duration: number; angle: number
}

Scroll + cursor animation and shooting stars spawner are archived in git history.
Also needs: skyRef, shootingStars state, ssIdRef

─────────────────────────────────────────────────────────────────────────────── */

export default function RocketHero() {
  const rocketRef     = useRef<HTMLDivElement>(null)
  const flameRef      = useRef<HTMLDivElement>(null)
  const launchTimeRef = useRef<number>(0)

  const [mode, setMode] = useState<'idle' | 'following'>('idle')
  const modeRef = useRef<'idle' | 'following'>('idle')

  function launch() {
    launchTimeRef.current = Date.now()
    modeRef.current = 'following'
    setMode('following')
  }

  function land() {
    modeRef.current = 'idle'
    setMode('idle')
  }

  useEffect(() => {
    let frameId: number
    const { x: ix, y: iy } = idlePos()
    let rx = ix, ry = iy
    let cursorX = ix, cursorY = iy
    let rotation = 0

    function onMouseMove(e: MouseEvent) {
      cursorX = e.clientX
      cursorY = e.clientY
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && modeRef.current === 'following') land()
    }

    function loop() {
      if (!rocketRef.current || !flameRef.current) {
        frameId = requestAnimationFrame(loop)
        return
      }

      const isIdle = modeRef.current === 'idle'
      const { x: idleX, y: idleY } = idlePos()

      const targetX = isIdle ? idleX : cursorX
      const targetY = isIdle ? idleY : cursorY

      rx += (targetX - rx) * 0.04
      ry += (targetY - ry) * 0.04

      // Gentle idle bob
      const bob = isIdle ? Math.sin(Date.now() / 900) * 4 : 0

      // Rotation
      if (isIdle) {
        rotation += (0 - rotation) * 0.05
      } else {
        const dx   = cursorX - rx
        const dy   = cursorY - ry
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 8) {
          const target = Math.atan2(dx, -dy) * (180 / Math.PI)
          let dr = target - rotation
          if (dr > 180) dr -= 360
          if (dr < -180) dr += 360
          rotation += dr * 0.06
        } else {
          rotation *= 0.95
        }
      }

      // Flame — brief boost spike on launch
      const msSinceLaunch = Date.now() - launchTimeRef.current
      const launchBoost   = msSinceLaunch < 500
        ? Math.max(0, 1 - msSinceLaunch / 250) * 1.2
        : 0

      let flameScale: number
      let flameOpacity: number
      if (isIdle) {
        flameScale   = 0.22 + launchBoost
        flameOpacity = 0.38
      } else {
        const dx   = cursorX - rx
        const dy   = cursorY - ry
        const dist = Math.sqrt(dx * dx + dy * dy)
        flameScale   = 0.3 + Math.min(1, dist / 200) * 0.7 + launchBoost
        flameOpacity = 0.6 + Math.min(0.4, dist / 200) * 0.4
      }

      rocketRef.current.style.transform =
        `translate(${(rx - RW / 2).toFixed(1)}px, ${(ry - RH / 2 + bob).toFixed(1)}px) rotate(${rotation.toFixed(2)}deg)`

      flameRef.current.style.transform = `translateX(-50%) scaleY(${flameScale.toFixed(2)})`
      flameRef.current.style.opacity   = flameOpacity.toFixed(2)

      frameId = requestAnimationFrame(loop)
    }

    loop()
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    window.addEventListener('keydown',   onKeyDown)
    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('keydown',   onKeyDown)
    }
  }, [])

  const isFollowing = mode === 'following'

  return (
    <>
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
          width: 13px; height: 25px; margin-left: -7px;
          background: radial-gradient(ellipse 56% 100% at 50% 0%,
            #ffb07a 0%, #ff8c6a 48%, rgba(255,130,90,0) 100%);
          animation: rh-f-outer 0.20s ease-in-out infinite;
        }
        .rh-f-mid {
          width: 8px; height: 18px; margin-left: -4px;
          background: radial-gradient(ellipse 56% 100% at 50% 0%,
            #ffe87a 0%, #ffc865 62%, transparent 100%);
          animation: rh-f-mid 0.14s ease-in-out infinite;
        }
        .rh-f-core {
          width: 3px; height: 11px; margin-left: -2px;
          background: radial-gradient(ellipse 60% 100% at 50% 0%,
            #ffffff 0%, #fff8cc 52%, transparent 100%);
          animation: rh-f-core 0.10s ease-in-out infinite;
        }

        /* ── Spinning text ring ── */
        @keyframes rh-ring-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .rh-ring {
          position: absolute;
          top: -40px;
          left: -50px;
          width: 170px;
          height: 170px;
          pointer-events: none;
          transform-origin: center center;
          animation: rh-ring-spin 18s linear infinite;
          transition: opacity 0.5s ease;
        }

        /* ── Rocket hover tooltip ── */
        .rh-rocket { outline: none; }
        .rh-rocket-idle { cursor: pointer; }
        .rh-launch-tip {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%) translateY(4px);
          background: #1c1c1c;
          color: #faf9f6;
          font-family: var(--font-sans, sans-serif);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          padding: 5px 12px;
          border-radius: 100px;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.16s ease, transform 0.16s ease;
        }
        /* Arrow */
        .rh-launch-tip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 4px solid transparent;
          border-top-color: #1c1c1c;
        }
        .rh-rocket-idle:hover .rh-launch-tip,
        .rh-rocket-idle:focus-visible .rh-launch-tip {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }

        /* ── Landing pad ── */
        .rh-pad {
          position: fixed;
          bottom: ${PAD_B}px;
          right:  ${PAD_R}px;
          width:  ${PAD_W}px;
          height: ${PAD_H}px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 19;
          transition: opacity 0.4s ease;
          user-select: none;
          -webkit-user-select: none;
          outline: none;
        }
        .rh-pad-idle {
          opacity: 0.3;
          pointer-events: none;
          cursor: default;
        }
        .rh-pad-active {
          opacity: 1;
          pointer-events: auto;
          cursor: pointer;
          animation: rh-pad-pulse 2.2s ease-in-out infinite;
        }
        .rh-pad-active:hover { animation-play-state: paused; opacity: 0.85; }
        @keyframes rh-pad-pulse {
          0%, 100% { filter: drop-shadow(0 2px 5px rgba(220,80,80,0.2)); }
          50%       { filter: drop-shadow(0 2px 18px rgba(220,80,80,0.6)); }
        }

        /* "land" label below pad */
        .rh-pad-label {
          position: absolute;
          top: calc(100% + 4px);
          left: 50%;
          transform: translateX(-50%);
          font-family: var(--font-sans, sans-serif);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #b06060;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
        }
        .rh-pad-active:hover .rh-pad-label,
        .rh-pad-active:focus-visible .rh-pad-label {
          opacity: 1;
        }

        /* Esc hint — appears above pad when following */
        .rh-esc-hint {
          position: fixed;
          bottom: ${PAD_B + PAD_H + 10}px;
          right:  ${PAD_R}px;
          font-family: var(--font-sans, sans-serif);
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.08em;
          color: rgba(0,0,0,0.3);
          white-space: nowrap;
          text-align: right;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.4s ease 0.6s;
          z-index: 19;
        }
        .rh-esc-hint-visible { opacity: 1; }

        /*
        ── SPACE BACKGROUND CSS — commented out, restore when needed ──────────

        .rh-sky-clip {
          position: absolute; inset: 0; overflow: hidden;
          pointer-events: none; z-index: 0;
        }
        .rh-sky {
          position: absolute; left: 0; right: 0; top: 0; height: 125%;
          will-change: transform;
          background: linear-gradient(to bottom,
            #0d1054 0%, #1b2b80 25%, #2e44a0 47%, #5a4a8a 64%,
            rgba(210,155,55,0.5) 80%, rgba(250,249,246,0) 100%);
        }
        .rh-sky::after {
          content: ''; position: absolute; bottom: 0; left: 50%;
          transform: translateX(-50%); width: 320px; height: 180px;
          background: radial-gradient(ellipse at 50% 100%,
            rgba(234,162,33,0.22) 0%, transparent 72%);
          pointer-events: none;
        }
        .rh-moon {
          position: absolute; top: 11%; right: 17%; z-index: 5;
          filter: drop-shadow(0 0 10px rgba(245,228,138,0.5))
                  drop-shadow(0 0 24px rgba(245,228,138,0.2));
        }
        .rh-planet {
          position: absolute; top: 58%; left: 7%; z-index: 5;
          filter: drop-shadow(0 0 10px rgba(200,130,110,0.45))
                  drop-shadow(0 0 26px rgba(200,130,110,0.18));
        }
        @keyframes rh-twinkle {
          0%, 100% { opacity: var(--star-op, 0.5); }
          50%      { opacity: calc(var(--star-op, 0.5) * 0.22); }
        }
        @keyframes rh-sparkle {
          0%, 100% { transform: scale(1) rotate(0deg);     opacity: 0.82; }
          30%      { transform: scale(1.45) rotate(18deg);  opacity: 1;    }
          70%      { transform: scale(0.78) rotate(-12deg); opacity: 0.5;  }
        }
        .rh-star {
          position: absolute; border-radius: 50%; z-index: 5;
          animation: rh-twinkle var(--star-dur, 2.5s) ease-in-out infinite;
          animation-delay: var(--star-delay, 0s);
        }
        .rh-sparkle {
          position: absolute; z-index: 5;
          animation: rh-sparkle var(--spark-dur, 3s) ease-in-out infinite;
          animation-delay: var(--spark-delay, 0s);
        }
        @keyframes rh-shoot {
          from { transform: rotate(var(--ss-angle)) translateX(0);              opacity: 0;    }
          8%   {                                                                 opacity: 0.85; }
          88%  {                                                                 opacity: 0.7;  }
          to   { transform: rotate(var(--ss-angle)) translateX(var(--ss-dist)); opacity: 0;    }
        }
        .rh-shooting-star {
          position: absolute; height: 1.5px; border-radius: 1px; z-index: 6;
          transform-origin: left center; pointer-events: none;
          background: linear-gradient(to right, transparent 0%,
            rgba(200,220,255,0.4) 30%, rgba(235,245,255,0.9) 78%, white 100%);
          animation: rh-shoot var(--ss-dur) ease-out forwards;
        }
        .rh-shooting-star::after {
          content: ''; position: absolute; right: -2px; top: 50%;
          transform: translateY(-50%); width: 3px; height: 3px;
          border-radius: 50%; background: white;
          box-shadow: 0 0 4px 1px rgba(180,210,255,0.9);
        }
        .rh-wave {
          position: absolute; left: 0; right: 0; width: 100%;
          display: block; pointer-events: none; z-index: 10;
        }
        .rh-wave-top { top: 0; }
        .rh-wave-bot { bottom: 22%; }

        ──────────────────────────────────────────────────────────────────────── */
      `}</style>

  
      {/* Landing pad — always in bottom-right; glows coral when rocket is out */}
      <div
        className={`rh-pad ${isFollowing ? 'rh-pad-active' : 'rh-pad-idle'}`}
        onClick={isFollowing ? land : undefined}
        role={isFollowing ? 'button' : undefined}
        tabIndex={isFollowing ? 0 : undefined}
        aria-label={isFollowing ? 'Land rocket' : undefined}
        onKeyDown={isFollowing ? (e) => e.key === 'Enter' && land() : undefined}
      >
        {/*
          3-D disc viewed at ~70° — ellipses foreshorten the flat rings,
          the cylinder wall adds depth, bottom rim closes the shape.
          viewBox 54×30: top-face ellipse at cx=27 cy=10 rx=24 ry=7.5,
          cylinder wall 7px tall, bottom rim arc at cy=17.
        */}
        <svg
          viewBox="0 0 54 30"
          width={PAD_W}
          height={PAD_H}
          aria-hidden="true"
          style={{ overflow: 'visible', display: 'block' }}
        >
          {/* Cylinder side wall — drawn first so top face sits on top */}
          <path
            d="M 3,10 L 3,17 A 24,7.5 0 0 0 51,17 L 51,10 Z"
            fill={isFollowing ? 'rgba(200,70,70,0.16)' : 'rgba(0,0,0,0.05)'}
          />
          {/* Bottom rim arc — visible edge of cylinder */}
          <path
            d="M 3,17 A 24,7.5 0 0 0 51,17"
            fill="none"
            stroke={isFollowing ? 'rgba(200,70,70,0.48)' : 'rgba(0,0,0,0.13)'}
            strokeWidth="1.2"
          />

          {/* Top face — filled so it covers the wall behind it */}
          <ellipse cx="27" cy="10" rx="24" ry="7.5"
            fill={isFollowing ? 'rgba(255,160,160,0.08)' : 'rgba(0,0,0,0.03)'}
          />
          {/* Outer dashed ring */}
          <ellipse cx="27" cy="10" rx="24" ry="7.5"
            fill="none"
            stroke={isFollowing ? 'rgba(210,70,70,0.72)' : 'rgba(0,0,0,0.19)'}
            strokeWidth="1.4"
            strokeDasharray="4.5 3"
          />
          {/* Middle ring */}
          <ellipse cx="27" cy="10" rx="15.5" ry="4.85"
            fill="none"
            stroke={isFollowing ? 'rgba(210,70,70,0.5)' : 'rgba(0,0,0,0.13)'}
            strokeWidth="0.9"
          />
          {/* Inner ring */}
          <ellipse cx="27" cy="10" rx="7.5" ry="2.35"
            fill="none"
            stroke={isFollowing ? 'rgba(210,70,70,0.55)' : 'rgba(0,0,0,0.13)'}
            strokeWidth="0.9"
          />
          {/* Center dot (foreshortened to match ellipse aspect ratio) */}
          <ellipse cx="27" cy="10" rx="2" ry="0.63"
            fill={isFollowing ? 'rgba(195,55,55,0.9)' : 'rgba(0,0,0,0.22)'}
          />

          {/* Crosshair ticks — horizontal (left & right of inner ring) */}
          <line x1="12" y1="10" x2="18" y2="10"
            stroke={isFollowing ? 'rgba(210,70,70,0.5)' : 'rgba(0,0,0,0.13)'}
            strokeWidth="1.1" strokeLinecap="round" />
          <line x1="36" y1="10" x2="42" y2="10"
            stroke={isFollowing ? 'rgba(210,70,70,0.5)' : 'rgba(0,0,0,0.13)'}
            strokeWidth="1.1" strokeLinecap="round" />
          {/* Crosshair ticks — vertical (foreshortened by ry/rx ratio) */}
          <line x1="27" y1="5.6" x2="27" y2="7.5"
            stroke={isFollowing ? 'rgba(210,70,70,0.5)' : 'rgba(0,0,0,0.13)'}
            strokeWidth="1.1" strokeLinecap="round" />
          <line x1="27" y1="12.5" x2="27" y2="14.4"
            stroke={isFollowing ? 'rgba(210,70,70,0.5)' : 'rgba(0,0,0,0.13)'}
            strokeWidth="1.1" strokeLinecap="round" />
        </svg>

        {/* "land" label — fades in on hover when active */}
        <span className="rh-pad-label" aria-hidden="true">land</span>
      </div>

      {/* Esc hint — floats above pad when following */}
      <div
        className={`rh-esc-hint${isFollowing ? ' rh-esc-hint-visible' : ''}`}
        aria-hidden="true"
      >
        esc to land
      </div>

      {/* Floating rocket */}
      <div
        ref={rocketRef}
        className={`rh-rocket${!isFollowing ? ' rh-rocket-idle' : ''}`}
        onClick={!isFollowing ? launch : undefined}
        role={!isFollowing ? 'button' : undefined}
        tabIndex={!isFollowing ? 0 : undefined}
        aria-label={!isFollowing ? 'Launch rocket — it will follow your cursor' : undefined}
        onKeyDown={!isFollowing ? (e) => e.key === 'Enter' && launch() : undefined}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: RW,
          height: RH,
          willChange: 'transform',
          zIndex: 20,
          pointerEvents: isFollowing ? 'none' : 'auto',
          transformOrigin: 'center center',
        }}
      >
        {/* "launch" tooltip — shown on hover in idle */}
        {!isFollowing && (
          <div className="rh-launch-tip" aria-hidden="true">launch</div>
        )}

        {/* Spinning text ring — visible when idle */}
        <div
          className="rh-ring"
          aria-hidden="true"
          style={{ opacity: isFollowing ? 0 : 1 }}
        >
          <svg width="170" height="170" viewBox="0 0 170 170" overflow="visible">
            <defs>
              <path
                id="rh-ring-path"
                d="M 85,85 m -68,0 a 68,68 0 1,1 136,0 a 68,68 0 1,1 -136,0"
              />
            </defs>
            <text
              fill="currentColor"
              fontSize="7.2"
              fontFamily="var(--font-sans, sans-serif)"
              fontWeight="700"
              style={{ opacity: 0.28 }}
            >
              <textPath href="#rh-ring-path" startOffset="0%" textLength="427" lengthAdjust="spacing">
                DESIGNED TO MAKE YOU SMILE • SINCE 2015 •
              </textPath>
            </text>
          </svg>
        </div>

        {/* Flame plume — trails behind direction of travel */}
        <div
          ref={flameRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: FLAME_BOTTOM,
            left: '50%',
            transform: 'translateX(-50%) scaleY(0.22)',
            transformOrigin: 'top center',
            opacity: 0.38,
            width: 13,
            height: 25,
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
          alt=""
          width={RW}
          height={RH}
          priority
          style={{
            display: 'block',
            position: 'relative',
            zIndex: 1,
            filter: 'drop-shadow(0px 3px 10px rgba(10,15,70,0.4)) drop-shadow(0px 1px 4px rgba(0,0,20,0.3))',
          }}
        />
      </div>
    </>
  )
}
