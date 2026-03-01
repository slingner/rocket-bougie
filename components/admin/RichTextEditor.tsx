'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { useEffect, useImperativeHandle, forwardRef } from 'react'

export type RichTextEditorHandle = {
  insertImage: (url: string) => void
}

const RichTextEditor = forwardRef<RichTextEditorHandle, {
  initialContent?: string
  onChange: (html: string) => void
}>(function RichTextEditor({ initialContent, onChange }, ref) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content: initialContent ?? '',
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getHTML())
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
  }))

  // Sync if initialContent changes (navigating between products)
  useEffect(() => {
    if (editor && initialContent !== undefined && editor.getHTML() !== initialContent) {
      editor.commands.setContent(initialContent)
    }
  }, [editor, initialContent])

  return (
    <div>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '2px',
          padding: '0.35rem 0.5rem',
          background: 'var(--background)',
          border: '1px solid var(--border)',
          borderRadius: '0.5rem 0.5rem 0 0',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBold().run()}
          active={editor?.isActive('bold')}
          title="Bold"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          active={editor?.isActive('italic')}
          title="Italic"
        >
          <em>I</em>
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor?.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor?.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          H3
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          active={editor?.isActive('bulletList')}
          title="Bullet list"
        >
          • ·
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          active={editor?.isActive('orderedList')}
          title="Ordered list"
        >
          1.
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          active={editor?.isActive('blockquote')}
          title="Blockquote"
        >
          ❝
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
          title="Clear formatting"
        >
          ✕
        </ToolbarButton>
      </div>

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
