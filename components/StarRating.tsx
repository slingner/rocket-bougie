interface Props {
  rating: number   // can be a decimal average, e.g. 4.3
  size?: 'sm' | 'md'
}

export default function StarRating({ rating, size = 'md' }: Props) {
  const fontSize = size === 'sm' ? '0.85rem' : '1.05rem'
  const gap = size === 'sm' ? '1px' : '2px'

  const label = `${rating.toFixed(1)} out of 5 stars`

  return (
    <span
      role="img"
      aria-label={label}
      style={{ display: 'inline-flex', gap, alignItems: 'center', lineHeight: 1 }}
    >
      {[1, 2, 3, 4, 5].map(i => {
        const fill = Math.min(1, Math.max(0, rating - (i - 1)))
        return (
          <span key={i} style={{ position: 'relative', display: 'inline-block', fontSize, color: '#e0d8d0' }}>
            {/* Empty star */}
            ★
            {/* Filled overlay clipped by fill fraction */}
            <span
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                overflow: 'hidden',
                width: `${fill * 100}%`,
                color: '#ffaaaa',
              }}
            >
              ★
            </span>
          </span>
        )
      })}
    </span>
  )
}
