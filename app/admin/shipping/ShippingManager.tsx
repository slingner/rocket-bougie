'use client'

import { useState, useTransition, useMemo } from 'react'

type ShippingProfile = {
  id: string
  name: string
  description: string | null
  base_price: number
  additional_price: number
  sort_order: number
  active: boolean
  pounds: number | null
  length_in: number | null
  width_in: number | null
  height_in: number | null
}

type Variant = {
  id: string
  option1_name: string | null
  option1_value: string | null
  option2_name: string | null
  option2_value: string | null
  price: number
  shipping_profile_id: string | null
  products: {
    id: string
    title: string
    product_type: string | null
    hidden: boolean
  }
}

type ProductGroup = {
  productId: string
  title: string
  productType: string | null
  variants: Variant[]
}

export default function ShippingManager({
  initialProfiles,
  initialVariants,
}: {
  initialProfiles: ShippingProfile[]
  initialVariants: Variant[]
}) {
  const [profiles, setProfiles] = useState(initialProfiles)
  const [variants, setVariants] = useState(initialVariants)
  const [activeTab, setActiveTab] = useState<'profiles' | 'assign'>('assign')
  const [isPending, startTransition] = useTransition()

  // Profile form state
  const [editingProfile, setEditingProfile] = useState<ShippingProfile | null>(null)
  const [showNewProfile, setShowNewProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formBase, setFormBase] = useState('')
  const [formAdditional, setFormAdditional] = useState('')
  const [formPounds, setFormPounds] = useState('')
  const [formLength, setFormLength] = useState('')
  const [formWidth, setFormWidth] = useState('')
  const [formHeight, setFormHeight] = useState('')

  // Assignment state
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null)
  const [filterType, setFilterType] = useState('')
  const [filterVariantValue, setFilterVariantValue] = useState('')
  const [searchText, setSearchText] = useState('')
  const [filterUnassigned, setFilterUnassigned] = useState(false)

  // Group variants by product
  const productGroups = useMemo<ProductGroup[]>(() => {
    const map = new Map<string, ProductGroup>()
    for (const v of variants) {
      const pid = v.products.id
      if (!map.has(pid)) {
        map.set(pid, {
          productId: pid,
          title: v.products.title,
          productType: v.products.product_type,
          variants: [],
        })
      }
      map.get(pid)!.variants.push(v)
    }
    return Array.from(map.values())
  }, [variants])

  const productTypes = useMemo(() => {
    return Array.from(new Set(productGroups.map(g => g.productType).filter(Boolean) as string[])).sort()
  }, [productGroups])

  // All unique variant option values for the currently selected type
  const variantValues = useMemo(() => {
    const sourceGroups = filterType
      ? productGroups.filter(g => g.productType === filterType)
      : productGroups
    const vals = new Set<string>()
    for (const g of sourceGroups) {
      for (const v of g.variants) {
        if (v.option1_value && v.option1_name !== 'Title') vals.add(v.option1_value)
        if (v.option2_value) vals.add(v.option2_value)
      }
    }
    return Array.from(vals).sort()
  }, [productGroups, filterType])

  const filteredGroups = useMemo(() => {
    const search = searchText.toLowerCase().trim()
    return productGroups
      .map(g => {
        // Apply type filter at product level
        if (filterType && g.productType !== filterType) return null

        // Apply title search
        if (search && !g.title.toLowerCase().includes(search)) return null

        // Apply variant value filter — keep the group but only show matching variants
        if (filterVariantValue) {
          const matchingVariants = g.variants.filter(v =>
            v.option1_value === filterVariantValue || v.option2_value === filterVariantValue
          )
          if (matchingVariants.length === 0) return null
          // Return group with only matching variants visible
          return { ...g, variants: matchingVariants }
        }

        // Apply unassigned filter
        if (filterUnassigned && g.variants.every(v => v.shipping_profile_id !== null)) return null

        return g
      })
      .filter(Boolean) as ProductGroup[]
  }, [productGroups, filterType, filterVariantValue, searchText, filterUnassigned])

  function openNewProfile() {
    setFormName(''); setFormDesc(''); setFormBase(''); setFormAdditional('')
    setFormPounds(''); setFormLength(''); setFormWidth(''); setFormHeight('')
    setProfileError(null); setEditingProfile(null); setShowNewProfile(true)
  }

  function openEditProfile(p: ShippingProfile) {
    setFormName(p.name); setFormDesc(p.description ?? '')
    setFormBase(String(p.base_price)); setFormAdditional(String(p.additional_price))
    setFormPounds(p.pounds != null ? String(p.pounds) : '')
    setFormLength(p.length_in != null ? String(p.length_in) : '')
    setFormWidth(p.width_in != null ? String(p.width_in) : '')
    setFormHeight(p.height_in != null ? String(p.height_in) : '')
    setProfileError(null); setShowNewProfile(false); setEditingProfile(p)
  }

  function cancelProfileForm() {
    setShowNewProfile(false); setEditingProfile(null); setProfileError(null)
  }

  async function saveProfile() {
    if (!formName.trim()) { setProfileError('Name is required'); return }
    if (!formBase || isNaN(Number(formBase))) { setProfileError('Valid base price required'); return }
    if (!formAdditional || isNaN(Number(formAdditional))) { setProfileError('Valid additional price required'); return }

    startTransition(async () => {
      const payload = {
        name: formName.trim(),
        description: formDesc.trim() || null,
        base_price: Number(formBase),
        additional_price: Number(formAdditional),
        pounds: formPounds ? Number(formPounds) : null,
        length_in: formLength ? Number(formLength) : null,
        width_in: formWidth ? Number(formWidth) : null,
        height_in: formHeight ? Number(formHeight) : null,
      }

      if (editingProfile) {
        const res = await fetch(`/api/admin/shipping/${editingProfile.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) { setProfileError('Failed to update'); return }
        const updated = await res.json()
        setProfiles(prev => prev.map(p => p.id === updated.id ? updated : p))
      } else {
        const res = await fetch('/api/admin/shipping', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, sort_order: profiles.length + 1 }),
        })
        if (!res.ok) { setProfileError('Failed to create'); return }
        const created = await res.json()
        setProfiles(prev => [...prev, created])
      }
      cancelProfileForm()
    })
  }

  async function deleteProfile(id: string) {
    if (!confirm('Delete this shipping profile? Variants using it will be unassigned.')) return
    startTransition(async () => {
      const res = await fetch(`/api/admin/shipping/${id}`, { method: 'DELETE' })
      if (!res.ok) { alert('Failed to delete'); return }
      setProfiles(prev => prev.filter(p => p.id !== id))
      setVariants(prev => prev.map(v => v.shipping_profile_id === id ? { ...v, shipping_profile_id: null } : v))
    })
  }

  async function assignVariants(variantIds: string[], profileId: string | null) {
    setAssignError(null)
    startTransition(async () => {
      const res = await fetch('/api/admin/shipping/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantIds, profileId }),
      })
      if (!res.ok) { setAssignError('Failed to assign'); return }
      const data = await res.json()
      setVariants(prev =>
        prev.map(v => variantIds.includes(v.id) ? { ...v, shipping_profile_id: profileId } : v)
      )
      setAssignSuccess(`Updated ${data.updated} variant${data.updated !== 1 ? 's' : ''}`)
      setTimeout(() => setAssignSuccess(null), 2500)
    })
  }

  // Assign a single product's variants (all at once)
  function handleProductAssign(group: ProductGroup, profileId: string | null) {
    assignVariants(group.variants.map(v => v.id), profileId)
  }

  // Assign a single variant
  function handleVariantAssign(variantId: string, profileId: string | null) {
    assignVariants([variantId], profileId)
  }

  // Bulk assign all filtered products
  function handleBulkAssign(profileId: string | null) {
    const ids = filteredGroups.flatMap(g => g.variants.map(v => v.id))
    if (ids.length === 0) return
    if (!confirm(`Assign ${ids.length} variant${ids.length !== 1 ? 's' : ''} to this profile?`)) return
    assignVariants(ids, profileId)
  }

  function profileLabel(profileId: string | null) {
    if (!profileId) return null
    return profiles.find(p => p.id === profileId)?.name ?? null
  }

  // For a product group, get the "display" profile:
  // - null if none assigned
  // - profile name if all variants share one profile
  // - 'Mixed' if they differ
  function groupProfileSummary(group: ProductGroup): string | null {
    const ids = group.variants.map(v => v.shipping_profile_id)
    if (ids.every(id => id === null)) return null
    if (ids.every(id => id === ids[0])) return profileLabel(ids[0])
    return 'Mixed'
  }

  const isMultiVariant = (group: ProductGroup) =>
    group.variants.length > 1 &&
    !(group.variants.length === 1 && group.variants[0].option1_name === 'Title')

  const variantLabel = (v: Variant) => {
    if (v.option1_name === 'Title' || v.option1_name === null) return 'Default'
    return [v.option1_value, v.option2_value].filter(Boolean).join(' / ')
  }

  const btnStyle = (variant: 'primary' | 'ghost' = 'ghost') => ({
    padding: '0.4rem 0.9rem',
    borderRadius: '0.4rem',
    border: variant === 'ghost' ? '1px solid var(--border)' : 'none',
    background: variant === 'primary' ? 'var(--foreground)' : 'transparent',
    color: variant === 'primary' ? 'var(--background)' : 'var(--foreground)',
    fontSize: '0.8rem',
    fontWeight: 500,
    fontFamily: 'inherit',
    cursor: 'pointer',
  } as React.CSSProperties)

  const inputStyle = {
    padding: '0.4rem 0.6rem',
    borderRadius: '0.4rem',
    border: '1px solid var(--border)',
    background: 'var(--background)',
    color: 'var(--foreground)',
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    width: '100%',
  } as React.CSSProperties

  const selectStyle = {
    ...inputStyle,
    width: 'auto',
    minWidth: 160,
  } as React.CSSProperties

  return (
    <div>
      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {(['assign', 'profiles'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: activeTab === tab ? 600 : 400,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--foreground)' : '2px solid transparent',
              cursor: 'pointer',
              color: activeTab === tab ? 'var(--foreground)' : 'var(--foreground)',
              opacity: activeTab === tab ? 1 : 0.5,
              fontFamily: 'inherit',
              marginBottom: '-1px',
            }}
          >
            {tab === 'assign' ? 'Product Assignments' : 'Rate Profiles'}
          </button>
        ))}
      </div>

      {/* ── PROFILES TAB ── */}
      {activeTab === 'profiles' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.5 }}>
              Each profile defines first-item and additional-item prices.
            </p>
            {!showNewProfile && !editingProfile && (
              <button style={btnStyle('primary')} onClick={openNewProfile}>+ New profile</button>
            )}
          </div>

          {(showNewProfile || editingProfile) && (
            <div style={{ background: 'var(--muted)', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.25rem' }}>
              <p style={{ margin: '0 0 1rem', fontWeight: 600, fontSize: '0.875rem' }}>
                {editingProfile ? 'Edit profile' : 'New profile'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.75rem', opacity: 0.6, display: 'block', marginBottom: '0.25rem' }}>Name</label>
                  <input style={inputStyle} value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. 8×10 Print" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.75rem', opacity: 0.6, display: 'block', marginBottom: '0.25rem' }}>Description (optional)</label>
                  <input style={inputStyle} value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="e.g. Ships in 12×9×0.5″ envelope" />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', opacity: 0.6, display: 'block', marginBottom: '0.25rem' }}>First item ($)</label>
                  <input style={inputStyle} type="number" step="0.01" min="0" value={formBase} onChange={e => setFormBase(e.target.value)} placeholder="3.50" />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', opacity: 0.6, display: 'block', marginBottom: '0.25rem' }}>Each additional ($)</label>
                  <input style={inputStyle} type="number" step="0.01" min="0" value={formAdditional} onChange={e => setFormAdditional(e.target.value)} placeholder="0.50" />
                </div>
                <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                  <p style={{ fontSize: '0.75rem', opacity: 0.5, margin: '0 0 0.5rem' }}>Package dimensions (for Pirateship export)</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', opacity: 0.6, display: 'block', marginBottom: '0.2rem' }}>Weight (lbs)</label>
                      <input style={inputStyle} type="number" step="0.01" min="0" value={formPounds} onChange={e => setFormPounds(e.target.value)} placeholder="0.30" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', opacity: 0.6, display: 'block', marginBottom: '0.2rem' }}>Length (in)</label>
                      <input style={inputStyle} type="number" step="0.01" min="0" value={formLength} onChange={e => setFormLength(e.target.value)} placeholder="12" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', opacity: 0.6, display: 'block', marginBottom: '0.2rem' }}>Width (in)</label>
                      <input style={inputStyle} type="number" step="0.01" min="0" value={formWidth} onChange={e => setFormWidth(e.target.value)} placeholder="9" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', opacity: 0.6, display: 'block', marginBottom: '0.2rem' }}>Height (in)</label>
                      <input style={inputStyle} type="number" step="0.01" min="0" value={formHeight} onChange={e => setFormHeight(e.target.value)} placeholder="0.5" />
                    </div>
                  </div>
                </div>
              </div>
              {profileError && <p style={{ color: '#dc2626', fontSize: '0.8rem', margin: '0 0 0.75rem' }}>{profileError}</p>}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button style={btnStyle('primary')} onClick={saveProfile} disabled={isPending}>
                  {isPending ? 'Saving…' : 'Save'}
                </button>
                <button style={btnStyle()} onClick={cancelProfileForm}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {profiles.map(p => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  background: 'var(--muted)',
                  borderRadius: '0.75rem',
                  padding: '1rem 1.25rem',
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</p>
                  {p.description && (
                    <p style={{ margin: '0.125rem 0 0', fontSize: '0.8rem', opacity: 0.5 }}>{p.description}</p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
                  <span>
                    <span style={{ opacity: 0.5, marginRight: '0.3rem' }}>1st</span>
                    <strong>${Number(p.base_price).toFixed(2)}</strong>
                  </span>
                  <span>
                    <span style={{ opacity: 0.5, marginRight: '0.3rem' }}>+ea</span>
                    <strong>${Number(p.additional_price).toFixed(2)}</strong>
                  </span>
                  {p.pounds != null && (
                    <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>
                      {p.pounds}lb · {p.length_in}×{p.width_in}×{p.height_in}″
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button style={btnStyle()} onClick={() => openEditProfile(p)}>Edit</button>
                  <button
                    style={{ ...btnStyle(), color: '#dc2626', borderColor: '#fecaca' }}
                    onClick={() => deleteProfile(p.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ASSIGNMENTS TAB ── */}
      {activeTab === 'assign' && (
        <div>
          {/* Filters + bulk assign */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <input
              style={{ ...inputStyle, width: 180 }}
              placeholder="Search products…"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
            <select
              style={selectStyle}
              value={filterType}
              onChange={e => { setFilterType(e.target.value); setFilterVariantValue('') }}
            >
              <option value="">All types</option>
              {productTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {variantValues.length > 0 && (
              <select
                style={selectStyle}
                value={filterVariantValue}
                onChange={e => setFilterVariantValue(e.target.value)}
              >
                <option value="">All variants</option>
                {variantValues.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            )}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filterUnassigned}
                onChange={e => setFilterUnassigned(e.target.checked)}
              />
              Unassigned only
            </label>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Bulk assign filtered:</span>
              <select
                style={selectStyle}
                defaultValue=""
                onChange={e => {
                  if (e.target.value !== '') {
                    handleBulkAssign(e.target.value || null)
                    e.target.value = ''
                  }
                }}
              >
                <option value="" disabled>Pick profile…</option>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          {assignError && <p style={{ color: '#dc2626', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{assignError}</p>}
          {assignSuccess && (
            <p style={{ color: '#16a34a', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{assignSuccess}</p>
          )}

          <div style={{ fontSize: '0.75rem', opacity: 0.4, marginBottom: '0.5rem' }}>
            {filteredGroups.length} product{filteredGroups.length !== 1 ? 's' : ''}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Product', 'Type', 'Variant', 'Shipping Profile'].map((h, i) => (
                    <th
                      key={i}
                      style={{
                        padding: '0.5rem 0.75rem',
                        textAlign: 'left',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        opacity: 0.45,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredGroups.map((group) => {
                  const multiVar = isMultiVariant(group)
                  const summary = groupProfileSummary(group)

                  if (!multiVar) {
                    // Single-variant product: one row with a profile dropdown
                    const v = group.variants[0]
                    return (
                      <tr key={group.productId} style={{ borderBottom: '1px solid var(--border)' }}
                        className="hover:bg-[var(--muted)] transition-colors">
                        <td style={{ padding: '0.625rem 0.75rem', fontWeight: 500 }}>{group.title}</td>
                        <td style={{ padding: '0.625rem 0.75rem', opacity: 0.5, fontSize: '0.8rem' }}>
                          {group.productType ?? '—'}
                        </td>
                        <td style={{ padding: '0.625rem 0.75rem', opacity: 0.4, fontSize: '0.8rem' }}>—</td>
                        <td style={{ padding: '0.625rem 0.75rem' }}>
                          <ProfileSelect
                            profiles={profiles}
                            value={v.shipping_profile_id}
                            onChange={(pid) => handleVariantAssign(v.id, pid)}
                            disabled={isPending}
                          />
                        </td>
                      </tr>
                    )
                  }

                  // Multi-variant product: header row + variant sub-rows
                  return [
                    <tr key={`${group.productId}-header`} style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, fontSize: '0.875rem' }} colSpan={2}>
                        {group.title}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', opacity: 0.4, fontSize: '0.8rem' }}>
                        {group.productType ?? '—'}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        {summary ? (
                          <span style={{
                            fontSize: '0.75rem',
                            padding: '0.1rem 0.5rem',
                            borderRadius: 100,
                            background: summary === 'Mixed' ? '#fef9c3' : '#dcfce7',
                            color: summary === 'Mixed' ? '#854d0e' : '#166534',
                          }}>
                            {summary}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', opacity: 0.4 }}>Unassigned</span>
                        )}
                      </td>
                    </tr>,
                    ...group.variants.map(v => (
                      <tr key={v.id} style={{ borderBottom: '1px solid var(--border)' }}
                        className="hover:bg-[var(--muted)] transition-colors">
                        <td style={{ padding: '0.5rem 0.75rem 0.5rem 1.5rem', opacity: 0.5, fontSize: '0.8rem' }}>
                          ↳
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', opacity: 0.5, fontSize: '0.8rem' }} />
                        <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>
                          {variantLabel(v)}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>
                          <ProfileSelect
                            profiles={profiles}
                            value={v.shipping_profile_id}
                            onChange={(pid) => handleVariantAssign(v.id, pid)}
                            disabled={isPending}
                          />
                        </td>
                      </tr>
                    )),
                  ]
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function ProfileSelect({
  profiles,
  value,
  onChange,
  disabled,
}: {
  profiles: ShippingProfile[]
  value: string | null
  onChange: (id: string | null) => void
  disabled: boolean
}) {
  return (
    <select
      value={value ?? ''}
      disabled={disabled}
      onChange={e => onChange(e.target.value || null)}
      style={{
        padding: '0.3rem 0.5rem',
        borderRadius: '0.4rem',
        border: '1px solid var(--border)',
        background: value ? 'var(--background)' : '#fef9c3',
        color: 'var(--foreground)',
        fontSize: '0.8rem',
        fontFamily: 'inherit',
        cursor: 'pointer',
      }}
    >
      <option value="">— unassigned —</option>
      {profiles.map(p => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  )
}
