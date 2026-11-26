'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { bannerLayout, type BannerBackground } from '@/lib/banner-backgrounds'

// Homepage holiday/season banner: a room photo with an empty frame, and Rocket Boogie art
// placed inside the frame. Copied from Color In Film's HomeBanner.
//
// The banner is a fixed 2:1 shape on desktop and a 3:4 portrait crop on phones (the 2:1
// crop leaves the frame small against a lot of wall at phone width). The room photo is
// object-fit: cover'd into it; bannerLayout works out where the frame opening lands.
const DESKTOP_RATIO = 2
const MOBILE_RATIO = 3 / 4

// Subtle inset shadow on the top/left inside edges of the art, mimicking the soft shadow a
// frame's rabbet casts onto the print — sells the art as sitting inside the frame rather than
// pasted flat on top of the photo.
const BANNER_INSET_SHADOW =
  'linear-gradient(to right, rgba(20,16,10,0.16), rgba(20,16,10,0) 3%), ' +
  'linear-gradient(to bottom, rgba(20,16,10,0.16), rgba(20,16,10,0) 3%)'

const ROTATE_MS = 4500

export interface BannerArt {
  title: string
  handle: string
  imageUrl: string
}

interface SeasonalBannerProps {
  headline: string
  subhead?: string | null
  // Auto-advances when there's more than one.
  art: BannerArt[]
  background: BannerBackground
}

function CopyBlock({
  headline, subhead, current, art, index, onSelect,
}: {
  headline: string
  subhead?: string | null
  current: BannerArt
  art: BannerArt[]
  index: number
  onSelect: (i: number) => void
}) {
  return (
    <div className="seasonal-banner-copy-inner">
      <h2 style={{
        fontFamily: 'var(--font-serif)',
        fontSize: 'clamp(1.85rem, 4vw, 3.25rem)',
        fontWeight: 400,
        letterSpacing: '-0.02em',
        lineHeight: 1.05,
        margin: '0 0 0.6rem',
        color: '#18140F',
      }}>
        {headline}
      </h2>
      {subhead && (
        <p style={{ fontSize: '1rem', lineHeight: 1.6, opacity: 0.7, margin: '0 0 1.25rem', color: '#18140F' }}>
          {subhead}
        </p>
      )}

      {/* Rotating art indicator — the label stays put, only the title crossfades */}
      <div className="seasonal-banner-nowplaying">
        <span className="seasonal-banner-nowplaying-label">From the studio</span>
        <span key={current.handle} className="seasonal-banner-nowplaying-title">{current.title}</span>
      </div>

      <span className="seasonal-banner-cta" style={{
        display: 'inline-block',
        fontSize: '0.9rem',
        fontWeight: 600,
        letterSpacing: '0.01em',
        borderBottom: '1px solid currentColor',
        paddingBottom: '0.1rem',
        color: '#18140F',
        marginTop: '1.1rem',
      }}>
        Shop now →
      </span>

      {art.length > 1 && (
        <div className="seasonal-banner-dots">
          {art.map((a, i) => (
            <button
              key={a.handle}
              type="button"
              aria-label={`Show ${a.title}`}
              className={`seasonal-banner-dot${i === index ? ' active' : ''}`}
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                onSelect(i)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function SeasonalBanner({ headline, subhead, art, background }: SeasonalBannerProps) {
  const desktop = bannerLayout(background, DESKTOP_RATIO, false)
  const mobile = bannerLayout(background, MOBILE_RATIO, true)
  const [index, setIndex] = useState(0)
  const rotating = art.length > 1

  useEffect(() => {
    // Visitors who've asked for less motion can still step through with the dots.
    if (!rotating || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setIndex(i => (i + 1) % art.length), ROTATE_MS)
    return () => clearInterval(id)
  }, [rotating, art.length])

  const current = art[index]
  const box = {
    position: 'absolute', left: 'var(--banner-box-left)', top: 'var(--banner-box-top)',
    width: 'var(--banner-box-width)', height: 'var(--banner-box-height)',
  } as const

  return (
    <Link href={`/products/${current.handle}`} aria-label={headline} style={{ display: 'block', width: '100%', textDecoration: 'none', color: 'inherit' }}>
      <style>{`
        .seasonal-banner-image {
          position: relative;
          width: 100%;
          overflow: hidden;
          aspect-ratio: ${DESKTOP_RATIO};
          --banner-box-left: ${desktop.left};
          --banner-box-top: ${desktop.top};
          --banner-box-width: ${desktop.width};
          --banner-box-height: ${desktop.height};
          --banner-object-position: ${desktop.position};
        }
        @media (max-width: 700px) {
          .seasonal-banner-image {
            aspect-ratio: ${MOBILE_RATIO} !important;
            --banner-box-left: ${mobile.left};
            --banner-box-top: ${mobile.top};
            --banner-box-width: ${mobile.width};
            --banner-box-height: ${mobile.height};
            --banner-object-position: ${mobile.position};
          }
        }
        .seasonal-banner-copy {
          position: absolute;
          inset: 0;
          bottom: ${(background.copyNudgeUp ?? 0) * 200}%;
          left: 56%;
          display: flex;
          align-items: center;
        }
        .seasonal-banner-copy-inner {
          position: relative;
          padding: 0 6% 0 8%;
          max-width: 560px;
        }
        @keyframes seasonalBannerFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .seasonal-banner-art { animation: seasonalBannerArtFade 0.6s ease both; }
        @keyframes seasonalBannerArtFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .seasonal-banner-nowplaying {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .seasonal-banner-nowplaying-label {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #8A6A2A;
          opacity: 0.9;
        }
        .seasonal-banner-nowplaying-title {
          display: block;
          font-size: 1.1rem;
          font-weight: 500;
          color: #18140F;
          opacity: 0.85;
          animation: seasonalBannerFadeIn 0.5s ease both;
        }
        .seasonal-banner-dots {
          display: flex;
          gap: 0.4rem;
          margin: 1.5rem -0.5rem 0;
        }
        .seasonal-banner-dot {
          width: 18px;
          height: 20px;
          padding: 0;
          border: none;
          background: transparent;
          cursor: pointer;
          position: relative;
        }
        .seasonal-banner-dot::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          width: 18px;
          height: 3px;
          border-radius: 2px;
          transform: translateY(-50%);
          background: rgba(24,20,15,0.2);
          transition: background 0.3s ease;
        }
        .seasonal-banner-dot.active::after {
          background: #18140F;
        }
        .seasonal-banner-copy-mobile { display: none; }
        @media (max-width: 700px) {
          .seasonal-banner-copy { display: none; }
          .seasonal-banner-copy-mobile {
            display: block;
            background: #18140F;
            padding: 1.6rem 1.5rem 1.75rem;
          }
          /* On phones the copy sits on a dark strip under the photo, so it flips to
             light-on-dark text. */
          .seasonal-banner-copy-mobile h2,
          .seasonal-banner-copy-mobile .seasonal-banner-nowplaying-title {
            color: #F5F0E8 !important;
          }
          .seasonal-banner-copy-mobile p {
            color: #F5F0E8 !important;
            opacity: 0.6 !important;
          }
          .seasonal-banner-copy-mobile .seasonal-banner-nowplaying-label {
            color: #D9A756 !important;
          }
          /* CTA becomes a filled pill (thumb-friendly tap target) instead of the
             desktop underline, which only worked as a subtle accent over the photo. */
          .seasonal-banner-copy-mobile .seasonal-banner-cta {
            border-bottom: none !important;
            background: #F5F0E8 !important;
            color: #18140F !important;
            padding: 0.6rem 1.1rem !important;
            border-radius: 100px !important;
            margin-top: 1.25rem !important;
          }
          .seasonal-banner-copy-mobile .seasonal-banner-dot::after {
            background: rgba(245,240,232,0.25);
          }
          .seasonal-banner-copy-mobile .seasonal-banner-dot.active::after {
            background: #F5F0E8;
          }
        }
      `}</style>
      <div className="seasonal-banner-image">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={background.src} alt="" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'var(--banner-object-position)' }} />
        <div style={{ ...box, background: '#fff', overflow: 'hidden' }}>
          <Image
            key={current.handle}
            className="seasonal-banner-art"
            src={current.imageUrl}
            alt={current.title}
            fill
            priority
            sizes="(max-width: 700px) 60vw, 30vw"
            style={{ objectFit: 'cover' }}
          />
        </div>
        <div aria-hidden style={{ ...box, background: BANNER_INSET_SHADOW, pointerEvents: 'none' }} />
        {background.foreground && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={background.foreground} alt="" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'var(--banner-object-position)', pointerEvents: 'none' }} />
        )}
        <div className="seasonal-banner-copy">
          <CopyBlock headline={headline} subhead={subhead} current={current} art={art} index={index} onSelect={setIndex} />
        </div>
      </div>
      <div className="seasonal-banner-copy-mobile">
        <CopyBlock headline={headline} subhead={subhead} current={current} art={art} index={index} onSelect={setIndex} />
      </div>
    </Link>
  )
}
