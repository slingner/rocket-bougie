'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { useEffect, useImperativeHandle, forwardRef, useState, useRef, useCallback } from 'react'
import { ResizableImage } from './ResizableImage'

export type RichTextEditorHandle = {
  insertImage: (url: string) => void
  setContent: (html: string) => void
}

const RichTextEditor = forwardRef<RichTextEditorHandle, {
  initialContent?: string
  onChange: (html: string) => void
}>(function RichTextEditor({ initialContent, onChange }, ref) {
  const [linkInputOpen, setLinkInputOpen] = useState(false)
  const [linkInput, setLinkInput] = useState('')
  const linkInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      ResizableImage.configure({ inline: false, allowBase64: false }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
    ],
    content: initialContent ?? '',
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
    // Close link input when selection moves away from a link
    onSelectionUpdate({ editor }) {
      if (linkInputOpen && !editor.isActive('link')) {
        setLinkInputOpen(false)
      }
    },
    editorProps: {
      attributes: {
        style: [
          'min-height: 180px',
          'padding: 0.75rem 0.875rem',
          'border-radius: 0 0 0.5rem 0.5rem',
          'border: 1px solid var(--border)',
          'border-top: none',
          'background: var(--background)',
          'font-size: 0.875rem',
          'line-height: 1.6',
          'color: var(--foreground)',
          'outline: none',
          'font-family: inherit',
        ].join('; '),
      },
    },
  })

  useImperativeHandle(ref, () => ({
    insertImage(url: string) {
      editor?.chain().focus().setImage({ src: url }).run()
    },
    setContent(html: string) {
      editor?.commands.setContent(html)
    },
  }))

  useEffect(() => {
    if (editor && initialContent !== undefined && editor.getHTML() !== initialContent) {
      editor.commands.setContent(initialContent)
    }
  }, [editor, initialContent])

  // Focus link input when it opens
  useEffect(() => {
    if (linkInputOpen) {
      setTimeout(() => linkInputRef.current?.focus(), 10)
    }
  }, [linkInputOpen])

  const isInLink = editor?.isActive('link') ?? false
  const activeLinkHref: string = editor?.getAttributes('link').href ?? ''

  function openLinkInput() {
    setLinkInput(activeLinkHref)
    setLinkInputOpen(true)
  }

  function closeLinkInput() {
    setLinkInputOpen(false)
    setLinkInput('')
    editor?.chain().focus().run()
  }

  function applyLink() {
    const url = linkInput.trim()
    if (!url) {
      editor?.chain().focus().unsetLink().run()
    } else {
      const href = url.startsWith('http') ? url : `https://${url}`
      editor?.chain().focus().setLink({ href }).run()
    }
    setLinkInputOpen(false)
    setLinkInput('')
  }

  function removeLink() {
    editor?.chain().focus().unsetLink().run()
    setLinkInputOpen(false)
  }

  function handleLinkButtonClick() {
    if (isInLink) {
      // If already in a link, open edit panel (pre-filled with current URL)
      openLinkInput()
    } else if (!editor?.state.selection.empty) {
      // Text selected — open panel to add a link
      openLinkInput()
    } else {
      // Nothing selected, not in a link — open panel anyway (they can type a URL)
      openLinkInput()
    }
  }

  const handleLinkKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); applyLink() }
    if (e.key === 'Escape') closeLinkInput()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkInput, editor])

  return (
    <div>
      {/* ── Toolbar ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '2px',
          padding: '0.35rem 0.5rem',
          background: 'var(--background)',
          border: '1px solid var(--border)',
          borderRadius: linkInputOpen ? '0.5rem 0.5rem 0 0' : '0.5rem 0.5rem 0 0',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <ToolbarButton onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} title="Bold">
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} title="Italic">
          <em>I</em>
        </ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })} title="Heading 2">
          H2
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive('heading', { level: 3 })} title="Heading 3">
          H3
        </ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')} title="Bullet list">
          • ·
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')} title="Ordered list">
          1.
        </ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive('blockquote')} title="Blockquote">
          ❝
        </ToolbarButton>
        <Divider />
        {/* Link button — highlighted when cursor is inside a link */}
        <ToolbarButton onClick={handleLinkButtonClick} active={isInLink || linkInputOpen} title={isInLink ? 'Edit link' : 'Add link'}>
          🔗
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear formatting">
          ✕
        </ToolbarButton>
      </div>

      {/* ── Link panel — appears between toolbar and content ── */}
      {linkInputOpen ? (
        // URL input mode — for adding or editing a link
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 0.6rem',
          background: '#fffdf9',
          border: '1px solid var(--border)',
          borderTop: 'none',
        }}>
          <span style={{ fontSize: '0.75rem', opacity: 0.45, flexShrink: 0 }}>URL</span>
          <input
            ref={linkInputRef}
            value={linkInput}
            onChange={e => setLinkInput(e.target.value)}
            onKeyDown={handleLinkKeyDown}
            placeholder="https://rocketboogie.com/shop"
            style={{
              flex: 1,
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              padding: '0.3rem 0.6rem',
              fontSize: '0.8rem',
              fontFamily: 'inherit',
              background: 'var(--background)',
              color: 'var(--foreground)',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); applyLink() }}
            style={linkActionBtn}
          >
            Apply
          </button>
          {isInLink && (
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); removeLink() }}
              style={{ ...linkActionBtn, color: '#991b1b', opacity: 0.7 }}
            >
              Remove
            </button>
          )}
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); closeLinkInput() }}
            style={{ ...linkActionBtn, opacity: 0.4 }}
          >
            ✕
          </button>
        </div>
      ) : isInLink ? (
        // Link info bar — shown when cursor is inside an existing link (read-only view)
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 0.6rem',
          background: '#fff8f8',
          border: '1px solid var(--border)',
          borderTop: 'none',
          borderColor: '#ffcccc',
        }}>
          <span style={{ fontSize: '0.7rem', opacity: 0.45, flexShrink: 0 }}>🔗</span>
          <span style={{
            flex: 1,
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            opacity: 0.7,
            color: 'var(--foreground)',
          }}>
            {activeLinkHref}
          </span>
          <a
            href={activeLinkHref}
            target="_blank"
            rel="noopener noreferrer"
            title="Open link"
            style={{ fontSize: '0.7rem', opacity: 0.4, textDecoration: 'none', color: 'var(--foreground)', flexShrink: 0 }}
          >
            ↗
          </a>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); openLinkInput() }}
            style={linkActionBtn}
          >
            Edit
          </button>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); removeLink() }}
            style={{ ...linkActionBtn, color: '#991b1b', opacity: 0.7 }}
          >
            Remove
          </button>
        </div>
      ) : null}

      <EditorContent editor={editor} />

      <style>{`
        .tiptap h2 { font-size: 1.15rem; font-weight: 600; margin: 0.75em 0 0.35em; }
        .tiptap h3 { font-size: 1rem; font-weight: 600; margin: 0.75em 0 0.35em; }
        .tiptap p { margin: 0 0 0.6em; }
        .tiptap p:last-child { margin-bottom: 0; }
        .tiptap ul, .tiptap ol { padding-left: 1.25em; margin: 0 0 0.6em; }
        .tiptap li { margin-bottom: 0.2em; }
        .tiptap blockquote { border-left: 3px solid var(--border); padding-left: 0.75em; opacity: 0.7; margin: 0.5em 0; }
        .tiptap strong { font-weight: 600; }
        .tiptap a { color: #1a1a1a; text-decoration: underline; text-underline-offset: 2px; cursor: text; }
        .tiptap img { max-width: 100%; height: auto; border-radius: 6px; display: block; margin: 8px 0; }
        .tiptap .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #aaa;
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  )
})

export default RichTextEditor

const linkActionBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.75rem',
  fontFamily: 'inherit',
  fontWeight: 500,
  color: 'var(--foreground)',
  padding: '0.2rem 0.4rem',
  borderRadius: '0.25rem',
  flexShrink: 0,
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      style={{
        background: active ? 'var(--border)' : 'none',
        border: 'none',
        borderRadius: '0.25rem',
        padding: '0.25rem 0.5rem',
        fontSize: '0.8rem',
        cursor: 'pointer',
        color: 'var(--foreground)',
        fontFamily: 'inherit',
        lineHeight: 1.4,
        opacity: active ? 1 : 0.65,
      }}
    >
      {children}
    </button>
  )
}

function Divider() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 1,
        background: 'var(--border)',
        margin: '2px 4px',
        alignSelf: 'stretch',
      }}
    />
  )
}
