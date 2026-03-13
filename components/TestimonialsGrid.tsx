'use client'

import { useState, useEffect, useRef } from 'react'

type Review = {
  id: string
  customer_name: string
  rating: number
  body: string
}

const INITIAL_COUNT = 4

export default function TestimonialsGrid({ reviews }: { reviews: Review[] }) {
  const [expanded, setExpanded] = useState(false)
  const [shuffled, setShuffled] = useState(reviews)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setShuffled([...reviews].sort(() => Math.random() - 0.5))
  }, [])

  const visible = expanded ? shuffled : shuffled.slice(0, INITIAL_COUNT)
  const hasMore = reviews.length > INITIAL_COUNT

  // After each render, equalize all card heights to the tallest card
  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    const cards = Array.from(grid.querySelectorAll<HTMLElement>('.testimonial-card'))
    cards.forEach(c => (c.style.height = ''))
    const max = Math.max(...cards.map(c => c.offsetHeight))
    cards.forEach(c => (c.style.height = `${max}px`))
  }, [visible])

  return (
    <>
      <style>{`
        .testimonials-grid {
          display: flex;
          gap: 1rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
          scrollbar-width: none;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
        }
        .testimonials-grid::-webkit-scrollbar { display: none; }
        .testimonial-card {
          flex-shrink: 0;
          width: 72vw;
          max-width: 260px;
          scroll-snap-align: start;
        }
        @media (min-width: 768px) {
          .testimonials-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            overflow-x: visible;
          }
          .testimonial-card {
            width: auto;
            max-width: none;
          }
        }
      `}</style>

      <div className="testimonials-grid" ref={gridRef}>
        {visible.map(review => (
          <article
            key={review.id}
            className="testimonial-card"
            style={{
              background: 'var(--muted)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.625rem',
            }}
          >
            <span
              aria-hidden
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '2rem',
                lineHeight: 0.75,
                color: 'var(--accent)',
                opacity: 0.6,
                display: 'block',
              }}
            >
              &ldquo;
            </span>

            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '0.875rem',
                fontStyle: 'italic',
                lineHeight: 1.6,
                margin: 0,
                flex: 1,
              }}
            >
              {review.body}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <span
                aria-label={`${review.rating} out of 5 stars`}
                style={{ color: 'var(--accent)', fontSize: '0.9rem', letterSpacing: '0.05em' }}
              >
                {'★'.repeat(review.rating)}
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  opacity: 0.45,
                }}
              >
                — {review.customer_name}
              </span>
            </div>
          </article>
        ))}
      </div>

      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              background: 'none',
              border: '1.5px solid var(--border)',
              borderRadius: '0.625rem',
              padding: '0.75rem 1.75rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              color: 'var(--foreground)',
              transition: 'border-color 0.15s, opacity 0.15s',
            }}
            className="hover:opacity-60"
          >
            {expanded ? 'Show less' : `See all ${shuffled.length} reviews`}
          </button>
        </div>
      )}
    </>
  )
}
