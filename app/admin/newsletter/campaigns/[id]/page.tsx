import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import CampaignComposer from '../../CampaignComposer'

export const metadata = { title: 'Campaign | Admin' }

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const [{ data: campaign }, { count }] = await Promise.all([
    supabase.from('newsletter_campaigns').select('*').eq('id', id).single(),
    supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true }).eq('status', 'subscribed'),
  ])

  if (!campaign) notFound()

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          href="/admin/newsletter"
          style={{ fontSize: '0.85rem', opacity: 0.5, textDecoration: 'none', color: 'var(--foreground)' }}
          className="hover:opacity-100"
        >
          ← Newsletter
        </Link>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.75rem',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            {campaign.subject}
          </h1>
          {campaign.status === 'sent' && (
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.2rem 0.65rem',
              borderRadius: '100px',
              background: '#dbeafe',
              color: '#1e40af',
            }}>
              Sent · {campaign.recipient_count} recipients
            </span>
          )}
        </div>
      </div>

      <CampaignComposer
        mode="edit"
        campaign={campaign}
        subscriberCount={count ?? 0}
      />
    </div>
  )
}
