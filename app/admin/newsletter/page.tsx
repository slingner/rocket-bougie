import { createAdminClient } from '@/lib/supabase/server'
import NewsletterManager from './NewsletterManager'

export const metadata = { title: 'Newsletter | Admin' }

export default async function NewsletterPage() {
  const supabase = createAdminClient()

  const [{ data: subscribers }, { data: campaigns }] = await Promise.all([
    supabase.from('newsletter_subscribers').select('*').order('subscribed_at', { ascending: false }),
    supabase.from('newsletter_campaigns').select('*').order('created_at', { ascending: false }),
  ])

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.75rem',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          Newsletter
        </h1>
      </div>

      <NewsletterManager
        subscribers={subscribers ?? []}
        campaigns={campaigns ?? []}
      />
    </div>
  )
}
