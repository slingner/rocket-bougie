'use client'

import { useState } from 'react'

type Month = {
  key: string
  label: string
  revenue: number
}

const CHART_HEIGHT = 160

export default function RevenueChart({ months }: { months: Month[] }) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const maxRevenue = Math.max(...months.map(m => m.revenue), 1)

  return (
    <div style={{ background: 'var(--muted)', borderRadius: '0.875rem', padding: '1.5rem 1.25rem 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: CHART_HEIGHT }}>
        {months.map(m => {
          const barHeight = m.revenue > 0 ? Math.max((m.revenue / maxRevenue) * CHART_HEIGHT, 4) : 0
          const isHovered = hoveredKey === m.key
          return (
            <div
              key={m.key}
              onMouseEnter={() => m.revenue > 0 && setHoveredKey(m.key)}
              onMouseLeave={() => setHoveredKey(null)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: '100%',
                position: 'relative',
              }}
            >
              {isHovered && m.revenue > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: barHeight + 8,
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    background: 'var(--foreground)',
                    color: 'var(--background)',
                    padding: '2px 6px',
                    borderRadius: 4,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                  }}
                >
                  ${m.revenue.toFixed(2)}
                </span>
              )}
              <div
                style={{
                  width: '75%',
                  height: barHeight,
                  background: 'var(--foreground)',
                  borderRadius: '3px 3px 0 0',
                  opacity: m.revenue > 0 ? (isHovered ? 1 : 0.75) : 0,
                  transition: 'opacity 0.1s',
                }}
              />
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: '0.5rem' }}>
        {months.map(m => (
          <div
            key={`lbl-${m.key}`}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: '0.65rem',
              opacity: hoveredKey === m.key ? 0.8 : 0.4,
              transition: 'opacity 0.1s',
            }}
          >
            {m.label}
          </div>
        ))}
      </div>
    </div>
  )
}
