'use client'

import { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { marked } from 'marked'
import TurndownService from 'turndown'

// turndown is CJS — handle bundler interop
const TD: typeof TurndownService = (TurndownService as any).default ?? TurndownService
const td = new TD({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
})

type Props = {
  noteId: string
  content: string  // markdown
  onChange: (markdown: string) => void
}

export default function RichTextEditor({ noteId, content, onChange }: Props) {
  const isProgrammatic = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start writing…' }),
    ],
    immediatelyRender: false,
    content: marked.parse(content) as string,
    editorProps: {
      attributes: { class: 'outline-none min-h-full' },
    },
    onUpdate({ editor }) {
      if (isProgrammatic.current) return
      const md = td.turndown(editor.getHTML())
      onChange(md)
    },
  })

  // Re-load content when the active note changes
  useEffect(() => {
    if (!editor) return
    isProgrammatic.current = true
    editor.commands.setContent(marked.parse(content) as string)
    isProgrammatic.current = false
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId])

  return (
    <EditorContent
      editor={editor}
      className="tiptap-editor flex-1 overflow-y-auto px-8 py-5"
    />
  )
}
