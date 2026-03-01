'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createCampaign, updateCampaign, sendCampaign, deleteCampaign } from './actions'

const RichTextEditor = dynamic(() => import('@/components/admin/RichTextEditor'), { ssr: false })

type Props = {
  mode: 'new' | 'edit'
  campaign?: {
    id: string
    subject: string
    preview_text: string | null
    content_html: string
    status: string
  }
  subscriberCount: number
}

export default function CampaignComposer({ mode, campaign, subscriberCount }: Props) {
  const router = useRouter()
  const [subject, setSubject] = useState(campaign?.subject ?? '')
  const [previewText, setPreviewText] = useState(campaign?.preview_text ?? '')
  const [contentHtml, setContentHtml] = useState(campaign?.content_html ?? '')
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isSending, startSendTransition] = useTransition()

  function handleSave() {
    setError(null)
    if (!subject.trim()) { setError('Subject is required'); return }
    if (!contentHtml.trim() || contentHtml === '<p></p>') { setError('Email body is required'); return }

    startTransition(async () => {
      try {
        if (mode === 'new') {
          const id = await createCampaign(subject.trim(), contentHtml, previewText.trim() || undefined)
          router.push(`/admin/newsletter/campaigns/${id}`)
        } else {
          await updateCampaign(campaign!.id, subject.trim(), contentHtml, previewText.trim() || undefined)
          setSuccessMsg('Saved')
          setTimeout(() => setSuccessMsg(null), 2000)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save')
      }
    })
  }

  function handleSend() {
    if (!confirm(`Send this campaign to ${subscriberCount} subscriber${subscriberCount !== 1 ? 's' : ''}? This cannot be undone.`)) return

    startSendTransition(async () => {
      try {
        const count = await sendCampaign(campaign!.id)
        router.push('/admin/newsletter')
        router.refresh()
        alert(`Sent to ${count} subscriber${count !== 1 ? 's' : ''}!`)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to send')
      }
    })
  }

  function handleDelete() {
    if (!confirm('Delete this draft? This cannot be undone.')) return
    startTransition(async () => {
      try {
        await deleteCampaign(campaign!.id)
        router.push('/admin/newsletter')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to delete')
      }
    })
  }

  const isSent = campaign?.status === 'sent'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 760 }}>

      <label style={labelStyle}>
        <span style={labelText}>Subject line</span>
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="What's new at Rocket Boogie Co."
          style={inputStyle}
          disabled={isSent}
          autoFocus={mode === 'new'}
        />
      </label>

      <label style={labelStyle}>
        <span style={labelText}>Preview text <span style={{ opacity: 0.5 }}>(shown in inbox below subject)</span></span>
        <input
          type="text"
          value={previewText}
          onChange={e => setPreviewText(e.target.value)}
          placeholder="Short teaser that shows in email clients…"
          style={inputStyle}
          disabled={isSent}
        />
      </label>

      <div style={labelStyle}>
        <span style={labelText}>Email body</span>
        {isSent ? (
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              padding: '1rem 1.25rem',
              background: 'var(--muted)',
              fontSize: '0.875rem',
              lineHeight: 1.7,
              minHeight: 200,
            }}
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        ) : (
          <RichTextEditor
            initialContent={campaign?.content_html}
            onChange={setContentHtml}
          />
        )}
      </div>

      {error && (
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#991b1b' }}>{error}</p>
      )}

      {!isSent && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || isSending}
            style={{
              ...btnPrimary,
              opacity: isPending || isSending ? 0.6 : 1,
              cursor: isPending || isSending ? 'not-allowed' : 'pointer',
            }}
          >
            {isPending ? 'Saving…' : mode === 'new' ? 'Save draft' : successMsg ?? 'Save changes'}
          </button>

          {mode === 'edit' && (
            <>
              <button
                type="button"
                onClick={handleSend}
                disabled={isPending || isSending || subscriberCount === 0}
                title={subscriberCount === 0 ? 'No active subscribers' : undefined}
                style={{
                  background: '#1d4ed8',
                  color: '#fff',
                  border: 'none',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: isPending || isSending || subscriberCount === 0 ? 'not-allowed' : 'pointer',
                  opacity: isPending || isSending || subscriberCount === 0 ? 0.6 : 1,
                  fontFamily: 'inherit',
                }}
              >
                {isSending ? 'Sending…' : `Send to ${subscriberCount} subscriber${subscriberCount !== 1 ? 's' : ''}`}
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending || isSending}
                style={{
                  marginLeft: 'auto',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  opacity: 0.4,
                  padding: 0,
                  fontFamily: 'inherit',
                  color: 'var(--foreground)',
                }}
                className="hover:opacity-100"
              >
                Delete draft
              </button>
            </>
          )}
        </div>
      )}

      {isSent && (
        <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.5 }}>
          This campaign has been sent and cannot be edited.
        </p>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.375rem' }
const labelText: React.CSSProperties = { fontSize: '0.8rem', fontWeight: 500, opacity: 0.6 }
const inputStyle: React.CSSProperties = {
  padding: '0.6rem 0.875rem',
  borderRadius: '0.5rem',
  border: '1px solid var(--border)',
  background: 'var(--background)',
  fontSize: '0.875rem',
  color: 'var(--foreground)',
  fontFamily: 'inherit',
  width: '100%',
}
const btnPrimary: React.CSSProperties = {
  background: 'var(--foreground)',
  color: 'var(--background)',
  border: 'none',
  padding: '0.55rem 1.25rem',
  borderRadius: '0.5rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  fontFamily: 'inherit',
}
