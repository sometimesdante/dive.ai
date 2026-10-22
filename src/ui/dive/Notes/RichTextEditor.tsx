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
  // The note and markdown the editor currently shows. Edits update `shown`
  // as they're reported, so only content changed from outside (switching
  // notes, restoring a version) is loaded back in.
  const shownNote = useRef(noteId)
  const shown     = useRef(content)

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
      const md = td.turndown(editor.getHTML())
      shown.current = md
      onChange(md)
    },
  })

  // Load content changed from outside: another note, or a restored version
  useEffect(() => {
    if (!editor) return
    if (noteId === shownNote.current && content === shown.current) return
    editor.commands.setContent(marked.parse(content) as string, { emitUpdate: false })
    shownNote.current = noteId
    shown.current     = content
  }, [editor, noteId, content])

  return (
    <EditorContent
      editor={editor}
      className="tiptap-editor flex-1 overflow-y-auto px-8 py-5"
    />
  )
}
