import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import CampaignComposer from '../../CampaignComposer'

export const metadata = { title: 'New Campaign | Admin' }

export default async function NewCampaignPage() {
  const supabase = createAdminClient()
  const { count } = await supabase
    .from('newsletter_subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'subscribed')

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
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.75rem',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            margin: '0.5rem 0 0',
          }}
        >
          New campaign
        </h1>
      </div>

      <CampaignComposer mode="new" subscriberCount={count ?? 0} />
    </div>
  )
}
