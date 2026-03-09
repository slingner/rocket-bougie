'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

const RW = 96
const RH = 124
const FLAME_BOTTOM = 4
const PAD_W = 54
const PAD_H = 30

function getAnchorCenter(): { x: number; y: number } {
  const el = document.getElementById('fr-anchor')
  if (el) {
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  }
  return { x: window.innerWidth / 2, y: window.innerHeight - 150 }
}

export default function FooterRocket() {
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
    if (mode === 'idle') return

    let frameId: number
    const { x: ix, y: iy } = getAnchorCenter()
    let rx = ix, ry = iy
    let cursorX = ix, cursorY = iy
    let rotation = 0

    function onMouseMove(e: MouseEvent) {
      cursorX = e.clientX
      cursorY = e.clientY
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') land()
    }

    function loop() {
      if (!rocketRef.current || !flameRef.current) {
        frameId = requestAnimationFrame(loop)
        return
      }

      rx += (cursorX - rx) * 0.04
      ry += (cursorY - ry) * 0.04

      const dx = cursorX - rx
      const dy = cursorY - ry
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist > 8) {
        const target = Math.atan2(dx, -dy) * (180 / Math.PI)
        let dr = target - rotation
        if (dr > 180)  dr -= 360
        if (dr < -180) dr += 360
        rotation += dr * 0.06
      } else {
        rotation *= 0.95
      }

      const msSinceLaunch = Date.now() - launchTimeRef.current
      const launchBoost = msSinceLaunch < 500 ? Math.max(0, 1 - msSinceLaunch / 250) * 1.2 : 0
      const flameScale   = 0.3 + Math.min(1, dist / 200) * 0.7 + launchBoost
      const flameOpacity = 0.6 + Math.min(0.4, dist / 200) * 0.4

      rocketRef.current.style.transform =
        `translate(${(rx - RW / 2).toFixed(1)}px, ${(ry - RH / 2).toFixed(1)}px) rotate(${rotation.toFixed(2)}deg)`
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
  }, [mode])

  const isFollowing = mode === 'following'

  return (
    <>
      <style>{`
        @keyframes fr-bob {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes fr-ring-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes fr-f-outer {
          0%,100% { transform: scaleX(1.00) scaleY(1.00); }
          18%     { transform: scaleX(0.86) scaleY(1.15); }
          38%     { transform: scaleX(1.08) scaleY(0.91); }
          58%     { transform: scaleX(0.90) scaleY(1.11); }
          78%     { transform: scaleX(1.06) scaleY(0.93); }
        }
        @keyframes fr-f-mid {
          0%,100% { transform: scaleX(1.00) scaleY(1.00); }
          25%     { transform: scaleX(0.74) scaleY(1.28); }
          75%     { transform: scaleX(1.22) scaleY(0.80); }
        }
        @keyframes fr-f-core {
          0%,100% { opacity: 0.95; }
          50%     { opacity: 1.00; }
        }
        @keyframes fr-pad-pulse {
          0%, 100% { filter: drop-shadow(0 2px 5px rgba(220,80,80,0.2)); }
          50%       { filter: drop-shadow(0 2px 18px rgba(220,80,80,0.6)); }
        }

        .fr-idle-wrap {
          position: relative;
          width: ${RW}px;
          height: ${RH}px;
          cursor: pointer;
          animation: fr-bob 3s ease-in-out infinite;
        }
        .fr-ring {
          position: absolute;
          top: -30px; left: -37px;
          width: 170px; height: 170px;
          pointer-events: none;
          transform-origin: center center;
          animation: fr-ring-spin 18s linear infinite;
          transition: opacity 0.4s ease;
        }
        .fr-launch-tip {
          position: absolute;
          bottom: calc(100% + 38px);
          left: 50%;
          transform: translateX(-50%) translateY(4px);
          background: #1c1c1c; color: #faf9f6;
          font-family: var(--font-sans, sans-serif);
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.13em; text-transform: uppercase;
          padding: 5px 12px; border-radius: 100px;
          white-space: nowrap; opacity: 0; pointer-events: none;
          transition: opacity 0.16s ease, transform 0.16s ease;
        }
        .fr-launch-tip::after {
          content: ''; position: absolute;
          top: 100%; left: 50%; transform: translateX(-50%);
          border: 4px solid transparent; border-top-color: #1c1c1c;
        }
        .fr-idle-wrap:hover .fr-launch-tip { opacity: 1; transform: translateX(-50%) translateY(0); }

        .fr-f {
          position: absolute; left: 50%; top: 0;
          transform-origin: top center;
          border-radius: 50% 50% 58% 58%;
        }
        .fr-f-outer {
          width: 13px; height: 25px; margin-left: -7px;
          background: radial-gradient(ellipse 56% 100% at 50% 0%,
            #ffb07a 0%, #ff8c6a 48%, rgba(255,130,90,0) 100%);
          animation: fr-f-outer 0.20s ease-in-out infinite;
        }
        .fr-f-mid {
          width: 8px; height: 18px; margin-left: -4px;
          background: radial-gradient(ellipse 56% 100% at 50% 0%,
            #ffe87a 0%, #ffc865 62%, transparent 100%);
          animation: fr-f-mid 0.14s ease-in-out infinite;
        }
        .fr-f-core {
          width: 3px; height: 11px; margin-left: -2px;
          background: radial-gradient(ellipse 60% 100% at 50% 0%,
            #ffffff 0%, #fff8cc 52%, transparent 100%);
          animation: fr-f-core 0.10s ease-in-out infinite;
        }

        .fr-pad {
          position: absolute; bottom: -10px; left: 50%;
          transform: translateX(-50%);
          transition: opacity 0.3s ease; outline: none;
          cursor: pointer;
          animation: fr-pad-pulse 2.2s ease-in-out infinite;
        }
        .fr-esc-hint {
          font-family: var(--font-sans, sans-serif);
          font-size: 9px; font-weight: 500; letter-spacing: 0.08em;
          color: rgba(0,0,0,0.3); text-align: center;
          margin-top: 0.4rem; pointer-events: none;
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.75rem 0 0' }}>

        {/* ── IDLE: static in footer with bob + ring ── */}
        {!isFollowing && (
          <div
            id="fr-anchor"
            className="fr-idle-wrap"
            onClick={launch}
            role="button"
            tabIndex={0}
            aria-label="Launch rocket — it will follow your cursor"
            onKeyDown={(e) => e.key === 'Enter' && launch()}
          >
            <div className="fr-launch-tip" aria-hidden="true">launch</div>

            <div className="fr-ring" aria-hidden="true">
              <svg width="170" height="170" viewBox="0 0 170 170" overflow="visible">
                <defs>
                  <path id="fr-ring-path" d="M 85,85 m -68,0 a 68,68 0 1,1 136,0 a 68,68 0 1,1 -136,0" />
                </defs>
                <text fill="#bf2d18" fontSize="12" fontFamily="var(--font-sans, sans-serif)" fontWeight="900" style={{ opacity: 0.55 }}>
                  <textPath href="#fr-ring-path" startOffset="2%" textLength="427" lengthAdjust="spacing">
                    {'DESIGNED TO MAKE YOU SMILE •'}
                  </textPath>
                </text>
              </svg>
            </div>

            <div style={{ position: 'absolute', bottom: FLAME_BOTTOM, left: '50%', transform: 'translateX(-50%) scaleY(0.22)', transformOrigin: 'top center', opacity: 0.38, width: 13, height: 25 }} aria-hidden="true">
              <div className="fr-f fr-f-outer" />
              <div className="fr-f fr-f-mid" />
              <div className="fr-f fr-f-core" />
            </div>

            <Image src="/rbc-milo.png" alt="" width={RW} height={RH} style={{ display: 'block', position: 'relative', zIndex: 1 }} />
          </div>
        )}

        {/* ── FLYING: fixed overlay following cursor ── */}
        {isFollowing && (
          <>
            {/* Placeholder keeps footer height stable while rocket is out */}
            <div id="fr-anchor" style={{ width: RW, height: RH, position: 'relative' }}>
              <div
                className="fr-pad"
                onClick={land}
                role="button"
                tabIndex={0}
                aria-label="Land rocket"
                onKeyDown={(e) => e.key === 'Enter' && land()}
              >
                <svg viewBox="0 0 54 30" width={PAD_W} height={PAD_H} aria-hidden="true" style={{ overflow: 'visible', display: 'block' }}>
                  <path d="M 3,10 L 3,17 A 24,7.5 0 0 0 51,17 L 51,10 Z" fill="rgba(200,70,70,0.16)" />
                  <path d="M 3,17 A 24,7.5 0 0 0 51,17" fill="none" stroke="rgba(200,70,70,0.48)" strokeWidth="1.2" />
                  <ellipse cx="27" cy="10" rx="24" ry="7.5" fill="rgba(255,160,160,0.08)" />
                  <ellipse cx="27" cy="10" rx="24" ry="7.5" fill="none" stroke="rgba(210,70,70,0.72)" strokeWidth="1.4" strokeDasharray="4.5 3" />
                  <ellipse cx="27" cy="10" rx="15.5" ry="4.85" fill="none" stroke="rgba(210,70,70,0.5)" strokeWidth="0.9" />
                  <ellipse cx="27" cy="10" rx="7.5" ry="2.35" fill="none" stroke="rgba(210,70,70,0.55)" strokeWidth="0.9" />
                  <ellipse cx="27" cy="10" rx="2" ry="0.63" fill="rgba(195,55,55,0.9)" />
                  <line x1="12" y1="10" x2="18" y2="10" stroke="rgba(210,70,70,0.5)" strokeWidth="1.1" strokeLinecap="round" />
                  <line x1="36" y1="10" x2="42" y2="10" stroke="rgba(210,70,70,0.5)" strokeWidth="1.1" strokeLinecap="round" />
                  <line x1="27" y1="5.6" x2="27" y2="7.5" stroke="rgba(210,70,70,0.5)" strokeWidth="1.1" strokeLinecap="round" />
                  <line x1="27" y1="12.5" x2="27" y2="14.4" stroke="rgba(210,70,70,0.5)" strokeWidth="1.1" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <div className="fr-esc-hint" aria-hidden="true">esc to land</div>

            {/* Fixed flying rocket */}
            <div
              ref={rocketRef}
              style={{ position: 'fixed', top: 0, left: 0, width: RW, height: RH, zIndex: 20, pointerEvents: 'none', transformOrigin: 'center center', willChange: 'transform' }}
            >
              <div ref={flameRef} aria-hidden="true" style={{ position: 'absolute', bottom: FLAME_BOTTOM, left: '50%', transform: 'translateX(-50%) scaleY(0.3)', transformOrigin: 'top center', opacity: 0.6, width: 13, height: 25, zIndex: 0, pointerEvents: 'none', willChange: 'transform, opacity' }}>
                <div className="fr-f fr-f-outer" />
                <div className="fr-f fr-f-mid" />
                <div className="fr-f fr-f-core" />
              </div>
              <Image src="/rbc-milo.png" alt="" width={RW} height={RH} style={{ display: 'block', position: 'relative', zIndex: 1 }} />
            </div>
          </>
        )}

      </div>
    </>
  )
}
