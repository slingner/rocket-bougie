'use client'

import Image from '@tiptap/extension-image'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/core'

// Size presets that produce clean email-safe inline widths
const SIZES = [
  { label: 'S', value: '180px', title: 'Small (180px)' },
  { label: 'M', value: '300px', title: 'Medium (300px)' },
  { label: 'L', value: '460px', title: 'Large (460px)' },
  { label: '↔', value: '100%', title: 'Full width' },
]

function ImageNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const currentWidth = node.attrs.width as string | null

  return (
    <NodeViewWrapper style={{ display: 'block', position: 'relative' }}>
      {/* Size toolbar — only visible when the image is selected */}
      {selected && (
        <div
          contentEditable={false}
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 10,
            display: 'flex',
            gap: 3,
            background: 'rgba(18,16,14,0.82)',
            borderRadius: 7,
            padding: '4px 5px',
            backdropFilter: 'blur(4px)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          }}
        >
          {SIZES.map(s => {
            const active = currentWidth === s.value
            return (
              <button
                key={s.value}
                type="button"
                title={s.title}
                onMouseDown={e => {
                  e.preventDefault() // keep editor focus
                  updateAttributes({ width: s.value })
                }}
                style={{
                  background: active ? '#ffaaaa' : 'transparent',
                  border: 'none',
                  color: active ? '#1a1a1a' : 'rgba(255,255,255,0.85)',
                  borderRadius: 5,
                  padding: '3px 9px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  lineHeight: 1.8,
                  letterSpacing: '0.02em',
                  transition: 'background 0.1s, color 0.1s',
                }}
              >
                {s.label}
              </button>
            )
          })}
        </div>
      )}

      {/* The actual image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={node.attrs.src as string}
        alt={(node.attrs.alt as string) ?? ''}
        style={{
          width: currentWidth ?? 'auto',
          maxWidth: '100%',
          height: 'auto',
          display: 'block',
          borderRadius: 6,
          margin: '8px 0',
          outline: selected ? '2px solid #ffaaaa' : '2px solid transparent',
          outlineOffset: 2,
          transition: 'outline-color 0.12s',
          cursor: 'default',
        }}
      />
    </NodeViewWrapper>
  )
}

// Extends Tiptap's Image extension with a resizable width attribute.
// The node view shows a size toolbar when the image is selected.
// getHTML() uses renderHTML (not the node view) so the output is clean email-safe HTML.
export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML(attrs) {
          if (!attrs.width) return {}
          return { style: `width:${attrs.width};max-width:100%;height:auto;` }
        },
        parseHTML(el) {
          // Parse from inline style, or fall back to the width attribute
          const style = el.getAttribute('style') ?? ''
          const match = style.match(/width:\s*([^;]+)/)
          return match?.[1]?.trim() ?? el.getAttribute('width') ?? null
        },
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView)
  },
})
