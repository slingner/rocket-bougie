'use client'

import { useState, useTransition } from 'react'
import { publishProductToEtsy, unlinkEtsyListing } from '@/app/admin/etsy/actions'
import type { EtsyShippingProfile, EtsyReturnPolicy } from '@/lib/etsy-utils'

// Etsy seller taxonomy IDs — verified against live API 2026-03-25
const TAXONOMY_BY_TYPE: Record<string, number> = {
  'Print':         119,  // Art & Collectibles > Prints
  'Mini Print':    119,  // Art & Collectibles > Prints
  'Sticker':       1326, // Paper & Party Supplies > Paper > Stickers, Labels & Tags > Stickers
  'Sticker Pack':  1326, // Paper & Party Supplies > Paper > Stickers, Labels & Tags > Stickers
  'Greeting Card': 1261, // Paper & Party Supplies > Paper > Greeting Cards
}

const WHEN_MADE_OPTIONS = [
  { value: 'made_to_order', label: 'Made to order' },
  { value: '2020_2023', label: '2020–2023' },
  { value: '2010_2019', label: '2010–2019' },
  { value: '2004_2009', label: '2004–2009' },
  { value: 'before_2004', label: 'Before 2004' },
]

export default function EtsyPublishButton({
  productId,
  listingId,
  shippingProfiles,
  returnPolicies,
  productType,
}: {
  productId: string
  listingId: string | null
  shippingProfiles: EtsyShippingProfile[]
  returnPolicies: EtsyReturnPolicy[]
  productType: string
}) {
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [publishedId, setPublishedId] = useState<number | null>(null)
  const [unlinked, setUnlinked] = useState(false)

  const [shippingProfileId, setShippingProfileId] = useState(
    shippingProfiles[0]?.shipping_profile_id?.toString() ?? ''
  )
  const [returnPolicyId, setReturnPolicyId] = useState(
    returnPolicies[0]?.return_policy_id?.toString() ?? ''
  )
  const [whenMade, setWhenMade] = useState('made_to_order')

  if ((listingId || publishedId) && !unlinked) {
    const id = publishedId ?? listingId
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <a
          href={`https://www.etsy.com/listing/${id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '0.8rem', opacity: 0.5, textDecoration: 'none', color: 'inherit', whiteSpace: 'nowrap' }}
          className="hover:opacity-100"
        >
          On Etsy ↗
        </a>
        <button
          onClick={() => {
            if (!confirm('Unlink this product from Etsy? This only removes the link here — it won\'t delete the listing on Etsy.')) return
            startTransition(async () => {
              await unlinkEtsyListing(productId)
              setUnlinked(true)
            })
          }}
          disabled={isPending}
          title="Unlink from Etsy"
          style={{ fontSize: '0.7rem', opacity: 0.3, background: 'none', border: 'none', cursor: 'pointer', padding: '0 0.1rem', color: 'inherit' }}
          className="hover:opacity-80"
        >
          ×
        </button>
      </div>
    )
  }

  function handleSubmit() {
    if (!shippingProfileId || !whenMade) return
    startTransition(async () => {
      const taxonomyId = TAXONOMY_BY_TYPE[productType]
      const result = await publishProductToEtsy(productId, {
        shipping_profile_id: Number(shippingProfileId),
        when_made: whenMade,
        taxonomy_id: taxonomyId,
        return_policy_id: returnPolicyId ? Number(returnPolicyId) : undefined,
      })
      if (result.ok) {
        setPublishedId(result.listing_id)
        setShowForm(false)
        if (result.warning) {
          setIsError(false)
          setMessage(result.warning)
        } else {
          setMessage('')
        }
      } else {
        setIsError(true)
        setMessage(result.error)
      }
    })
  }

  const inputStyle: React.CSSProperties = {
    fontSize: '0.8rem',
    padding: '0.3rem 0.5rem',
    border: '1px solid var(--border)',
    borderRadius: 4,
    background: 'var(--background)',
    color: 'var(--foreground)',
    fontFamily: 'inherit',
    width: '100%',
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowForm((v) => !v)}
        style={{
          fontSize: '0.8rem',
          padding: '0.35rem 0.75rem',
          border: '1px dashed var(--border)',
          borderRadius: 4,
          background: 'transparent',
          cursor: 'pointer',
          fontFamily: 'inherit',
          color: 'var(--foreground)',
          whiteSpace: 'nowrap',
        }}
      >
        + Publish to Etsy
      </button>

    {showForm && (
    <div style={{
      position: 'absolute',
      top: 'calc(100% + 8px)',
      right: 0,
      zIndex: 100,
      background: 'var(--background)',
      border: '1px solid var(--border)',
      borderRadius: 6,
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      width: 320,
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
    }}>
      <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 500 }}>Publish to Etsy as draft</p>

      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.775rem' }}>
        Shipping profile
        <select value={shippingProfileId} onChange={(e) => setShippingProfileId(e.target.value)} style={inputStyle}>
          {shippingProfiles.map((p) => (
            <option key={p.shipping_profile_id} value={p.shipping_profile_id}>{p.title}</option>
          ))}
        </select>
      </label>

      {returnPolicies.length > 0 && (
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.775rem' }}>
          Return policy
          <select value={returnPolicyId} onChange={(e) => setReturnPolicyId(e.target.value)} style={inputStyle}>
            {returnPolicies.map((p) => (
              <option key={p.return_policy_id} value={p.return_policy_id}>
                {p.accepts_returns ? 'Accepts returns' : 'No returns'} / {p.accepts_exchanges ? 'accepts exchanges' : 'no exchanges'}
              </option>
            ))}
          </select>
        </label>
      )}

      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.775rem' }}>
        When was it made?
        <select value={whenMade} onChange={(e) => setWhenMade(e.target.value)} style={inputStyle}>
          {WHEN_MADE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>

{message && (
        <p style={{ margin: 0, fontSize: '0.775rem', color: isError ? '#dc2626' : '#166534' }}>{message}</p>
      )}

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={handleSubmit}
          disabled={isPending || !shippingProfileId}
          style={{
            fontSize: '0.8rem',
            padding: '0.4rem 0.875rem',
            border: '1px solid var(--border)',
            borderRadius: 4,
            background: 'transparent',
            cursor: (!shippingProfileId || isPending) ? 'not-allowed' : 'pointer',
            opacity: (!shippingProfileId || isPending) ? 0.4 : 1,
            fontFamily: 'inherit',
            color: 'var(--foreground)',
          }}
        >
          {isPending ? 'Publishing…' : 'Create Etsy draft'}
        </button>
        <button
          onClick={() => setShowForm(false)}
          style={{
            fontSize: '0.8rem',
            padding: '0.4rem 0.5rem',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            opacity: 0.4,
            fontFamily: 'inherit',
            color: 'var(--foreground)',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
    )}
    </div>
  )
}
