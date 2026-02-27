'use client'

import { useState, useTransition } from 'react'
import { renameTag, deleteTag } from '../actions'

type TagRow = { tag: string; count: number }

export default function TagsEditor({ tags: initialTags }: { tags: TagRow[] }) {
  const [tags, setTags] = useState(initialTags)
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function startEdit(tag: string) {
    setEditing(tag)
    setEditValue(tag)
    setFeedback(null)
  }

  function cancelEdit() {
    setEditing(null)
    setEditValue('')
  }

  function handleRename(oldTag: string) {
    const newTag = editValue.trim()
    if (!newTag || newTag === oldTag) { cancelEdit(); return }
    startTransition(async () => {
      try {
        await renameTag(oldTag, newTag)
        setTags(prev => prev.map(t => t.tag === oldTag ? { ...t, tag: newTag } : t))
        setEditing(null)
        setFeedback({ type: 'success', message: `Renamed "${oldTag}" to "${newTag}"` })
      } catch (e) {
        setFeedback({ type: 'error', message: e instanceof Error ? e.message : 'Rename failed' })
      }
    })
  }

  function handleDelete(tag: string) {
    if (!confirm(`Remove tag "${tag}" from all products? This cannot be undone.`)) return
    startTransition(async () => {
      try {
        await deleteTag(tag)
        setTags(prev => prev.filter(t => t.tag !== tag))
        setFeedback({ type: 'success', message: `Deleted tag "${tag}"` })
      } catch (e) {
        setFeedback({ type: 'error', message: e instanceof Error ? e.message : 'Delete failed' })
      }
    })
  }

  return (
    <div>
      {feedback && (
        <div
          style={{
            padding: '0.625rem 1rem',
            borderRadius: '0.5rem',
            background: feedback.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: feedback.type === 'success' ? '#166534' : '#991b1b',
            fontSize: '0.875rem',
            marginBottom: '1rem',
          }}
        >
          {feedback.message}
        </div>
      )}

      <div
        style={{
          background: 'var(--muted)',
          borderRadius: '0.875rem',
          overflow: 'hidden',
        }}
      >
        {tags.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', opacity: 0.4, margin: 0 }}>No tags found.</p>
        ) : (
          tags.map(({ tag, count }, i) => (
            <div
              key={tag}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1.25rem',
                borderBottom: i < tags.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              {editing === tag ? (
                // Edit mode
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                  <input
                    type="text"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRename(tag)
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    autoFocus
                    style={{
                      flex: 1,
                      padding: '0.35rem 0.625rem',
                      borderRadius: '0.375rem',
                      border: '1px solid var(--border)',
                      background: 'var(--background)',
                      fontSize: '0.875rem',
                      color: 'var(--foreground)',
                      fontFamily: 'inherit',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRename(tag)}
                    disabled={isPending}
                    style={actionBtn('#166534', '#dcfce7')}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    style={actionBtn('var(--foreground)', 'var(--border)')}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                // Display mode
                <>
                  <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500 }}>{tag}</span>
                  <span style={{ fontSize: '0.8rem', opacity: 0.4, minWidth: 60 }}>
                    {count} product{count !== 1 ? 's' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => startEdit(tag)}
                    style={actionBtn('var(--foreground)', 'var(--border)')}
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(tag)}
                    disabled={isPending}
                    style={actionBtn('#991b1b', '#fee2e2')}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function actionBtn(color: string, bg: string): React.CSSProperties {
  return {
    background: bg,
    color,
    border: 'none',
    borderRadius: '0.375rem',
    padding: '0.3rem 0.75rem',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  }
}
