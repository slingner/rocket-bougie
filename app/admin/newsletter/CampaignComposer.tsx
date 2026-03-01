'use client'

import { useState, useTransition, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createCampaign, updateCampaign, sendCampaign, deleteCampaign } from './actions'
import { TEMPLATES, buildTemplateHtml, type TemplateId } from './email-templates'
import type { RichTextEditorHandle } from '@/components/admin/RichTextEditor'

const RichTextEditor = dynamic(() => import('@/components/admin/RichTextEditor'), { ssr: false })
const TemplatePickerModal = dynamic(() => import('@/components/admin/TemplatePickerModal'), { ssr: false })
const ImagePicker = dynamic(() => import('@/components/admin/ImagePicker'), { ssr: false })

type Props = {
  mode: 'new' | 'edit'
  campaign?: {
    id: string
    subject: string
    preview_text: string | null
    content_html: string
    status: string
    template_id: string
    image_url: string | null
  }
  subscriberCount: number
}

export default function CampaignComposer({ mode, campaign, subscriberCount }: Props) {
  const router = useRouter()
  const editorRef = useRef<RichTextEditorHandle>(null)

  const [subject, setSubject] = useState(campaign?.subject ?? '')
  const [previewText, setPreviewText] = useState(campaign?.preview_text ?? '')
  const [contentHtml, setContentHtml] = useState(campaign?.content_html ?? '')
  const [templateId, setTemplateId] = useState<TemplateId>((campaign?.template_id as TemplateId) ?? 'classic')
  const [imageUrl, setImageUrl] = useState(campaign?.image_url ?? '')

  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [showImagePicker, setShowImagePicker] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isSending, startSendTransition] = useTransition()

  const currentTemplate = TEMPLATES.find(t => t.id === templateId)
  const isSent = campaign?.status === 'sent'

  const previewHtml = useMemo(() => buildTemplateHtml(templateId, {
    subject: subject || 'Your subject line',
    previewText: previewText || null,
    bodyContent: contentHtml || '<p style="color:#aaa;">Your email content will appear here…</p>',
    imageUrl: imageUrl || null,
    siteUrl: 'https://rocketboogie.com',
    unsubscribeUrl: '#',
    physicalAddress: 'San Francisco, CA',
  }), [templateId, subject, previewText, contentHtml, imageUrl])

  function handleSave() {
    setError(null)
    if (!subject.trim()) { setError('Subject is required'); return }
    if (!contentHtml.trim() || contentHtml === '<p></p>') { setError('Email body is required'); return }

    startTransition(async () => {
      try {
        if (mode === 'new') {
          const id = await createCampaign(
            subject.trim(),
            contentHtml,
            previewText.trim() || undefined,
            templateId,
            imageUrl.trim() || undefined
          )
          router.push(`/admin/newsletter/campaigns/${id}`)
        } else {
          await updateCampaign(
            campaign!.id,
            subject.trim(),
            contentHtml,
            previewText.trim() || undefined,
            templateId,
            imageUrl.trim() || undefined
          )
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

  const handleImageInsert = useCallback((url: string) => {
    editorRef.current?.insertImage(url)
    setShowImagePicker(false)
  }, [])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 1fr) 400px', gap: '2rem', alignItems: 'start' }}>
    {/* ── Left: form ── */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Template selector row */}
      {!isSent && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowTemplatePicker(true)}
            style={{
              background: 'var(--muted)',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              padding: '0.45rem 0.875rem',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
              color: 'var(--foreground)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span style={{ opacity: 0.5 }}>⊞</span>
            Choose template
          </button>
          {/* Active template badge */}
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '0.2rem 0.65rem',
            borderRadius: '100px',
            background: '#fff8f8',
            border: '1px solid #ffaaaa',
            color: '#1a1a1a',
          }}>
            {currentTemplate?.name ?? 'Classic'}
          </span>
          {currentTemplate?.hasImage && (
            <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>← uses image below</span>
          )}
        </div>
      )}

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

      {/* Image URL — shown for templates that feature a layout image */}
      {(currentTemplate?.hasImage || imageUrl) && !isSent && (
        <div style={labelStyle}>
          <span style={labelText}>
            Template image URL
            <span style={{ opacity: 0.45, fontWeight: 400 }}> — used by {currentTemplate?.name} layout</span>
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="https://… or pick from your products below"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              type="button"
              onClick={() => setShowImagePicker(true)}
              style={{
                background: 'var(--muted)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                padding: '0.6rem 0.875rem',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
                color: 'var(--foreground)',
                whiteSpace: 'nowrap',
                fontWeight: 500,
              }}
            >
              Browse images
            </button>
          </div>
          {imageUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={imageUrl}
              alt="Template image preview"
              style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: '0.375rem', border: '1px solid var(--border)' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}
        </div>
      )}

      <div style={labelStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <span style={labelText}>Email body</span>
          {!isSent && (
            <button
              type="button"
              onClick={() => setShowImagePicker(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.78rem',
                color: 'var(--foreground)',
                opacity: 0.5,
                fontFamily: 'inherit',
                padding: '2px 4px',
              }}
              className="hover:opacity-100"
            >
              + Insert image
            </button>
          )}
        </div>
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
            ref={editorRef}
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

    </div>{/* end form column */}

    {/* ── Right: live preview ── */}
    <div style={{ position: 'sticky', top: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.625rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.4 }}>
          Preview
        </span>
        <span style={{ fontSize: '0.7rem', opacity: 0.3 }}>— updates as you type</span>
      </div>
      <div style={{
        border: '1px solid var(--border)',
        borderRadius: '0.875rem',
        overflow: 'hidden',
        background: '#eeeae4',
        boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.06)',
      }}>
        {/* Fake email client chrome */}
        <div style={{
          background: '#e8e3dc',
          padding: '10px 14px',
          borderBottom: '1px solid #d8d2c8',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f4b8b8' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f4d9a8' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#b8d8b8' }} />
          <div style={{ flex: 1, height: 20, background: '#ddd8d0', borderRadius: 4, marginLeft: 8 }} />
        </div>
        {/* Scaled iframe */}
        <div style={{ height: 580, overflowY: 'auto', overflowX: 'hidden' }}>
          <iframe
            srcDoc={previewHtml}
            title="Email preview"
            sandbox="allow-same-origin"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block',
            }}
          />
        </div>
      </div>
    </div>

    {/* Modals — outside the grid columns so they overlay everything */}
    {showTemplatePicker && (
      <TemplatePickerModal
        current={templateId}
        onSelect={setTemplateId}
        onClose={() => setShowTemplatePicker(false)}
      />
    )}
    {showImagePicker && (
      <ImagePicker
        onInsert={handleImageInsert}
        onClose={() => setShowImagePicker(false)}
      />
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
