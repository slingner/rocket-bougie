export default function OrderDetailLoading() {
  return (
    <div style={{ maxWidth: 860 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
        <div style={{ width: 60, height: 16, background: 'var(--border)', borderRadius: 4 }} />
        <div style={{ width: 180, height: 28, background: 'var(--border)', borderRadius: 6 }} />
      </div>

      {/* Two-column cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ background: 'var(--muted)', borderRadius: '0.875rem', padding: '1.25rem 1.5rem', height: 180 }} />
        <div style={{ background: 'var(--muted)', borderRadius: '0.875rem', padding: '1.25rem 1.5rem', height: 180 }} />
      </div>

      {/* Items */}
      <div style={{ marginTop: '1.5rem', background: 'var(--muted)', borderRadius: '0.875rem', overflow: 'hidden' }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div style={{ width: 52, height: 52, borderRadius: '0.5rem', background: 'var(--border)', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ width: '60%', height: 14, background: 'var(--border)', borderRadius: 4 }} />
              <div style={{ width: '30%', height: 12, background: 'var(--border)', borderRadius: 4 }} />
            </div>
            <div style={{ width: 50, height: 14, background: 'var(--border)', borderRadius: 4 }} />
          </div>
        ))}
      </div>

      {/* Form skeleton */}
      <div style={{ marginTop: '1.5rem', background: 'var(--muted)', borderRadius: '0.875rem', padding: '1.5rem', height: 220 }} />
    </div>
  )
}
