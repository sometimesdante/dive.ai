'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Plus, Trash2, FileText, ChevronLeft, History, RotateCcw } from 'lucide-react'
import RichTextEditor from './RichTextEditor'
import { useRouter } from 'next/navigation'
import Topbar from '@/ui/dive/Topbar'
import {
  createNote,
  saveNote,
  deleteNote,
  getNoteVersions,
  restoreNoteVersion,
} from '@/app/(dive)/projects/[id]/notes/actions'

const Mindmap = dynamic(() => import('./Mindmap'), { ssr: false })

type Note = { id: string; title: string; content: string; updated_at: string }
type Version = { id: string; title: string; created_at: string }
type ViewMode = 'write' | 'mindmap'
type Project = { id: string; name: string; code: string }

type Props = {
  project: Project
  initialNotes: Note[]
  currentUserId: string
}

const AUTOSAVE_MS = 2000

export default function NotesEditor({ project, initialNotes, currentUserId }: Props) {
  const router = useRouter()
  const [notes, setNotes]               = useState<Note[]>(initialNotes)
  const [activeId, setActiveId]         = useState<string | null>(initialNotes[0]?.id ?? null)
  const [title, setTitle]               = useState(initialNotes[0]?.title ?? '')
  const [content, setContent]           = useState(initialNotes[0]?.content ?? '')
  const [view, setView]                 = useState<ViewMode>('write')
  const [saving, setSaving]             = useState(false)
  const [versions, setVersions]         = useState<Version[]>([])
  const [showHistory, setShowHistory]   = useState(false)
  const [dirty, setDirty]               = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSaved = useRef<{ title: string; content: string } | null>(null)

  const activeNote = notes.find(n => n.id === activeId)

  // Load note into editor
  function selectNote(note: Note) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    if (dirty && activeId) flushSave(activeId, title, content)
    setActiveId(note.id)
    setTitle(note.title)
    setContent(note.content)
    setDirty(false)
    lastSaved.current = { title: note.title, content: note.content }
    setShowHistory(false)
  }

  async function flushSave(id: string, t: string, c: string) {
    if (lastSaved.current?.title === t && lastSaved.current?.content === c) return
    setSaving(true)
    await saveNote(id, project.id, t, c)
    lastSaved.current = { title: t, content: c }
    setNotes(prev => prev.map(n => n.id === id ? { ...n, title: t, content: c } : n))
    setSaving(false)
  }

  // Autosave
  useEffect(() => {
    if (!activeId || !dirty) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      flushSave(activeId, title, content)
      setDirty(false)
    }, AUTOSAVE_MS)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [title, content, activeId, dirty])

  function handleTitleChange(val: string) {
    setTitle(val)
    setDirty(true)
  }

  function handleContentChange(val: string) {
    setContent(val)
    setDirty(true)
  }

  async function handleCreate() {
    const result = await createNote(project.id)
    if (result.error || !result.id) return
    const newNote: Note = { id: result.id, title: 'Untitled', content: '', updated_at: new Date().toISOString() }
    setNotes(prev => [newNote, ...prev])
    selectNote(newNote)
  }

  async function handleDelete(noteId: string) {
    await deleteNote(noteId, project.id)
    const remaining = notes.filter(n => n.id !== noteId)
    setNotes(remaining)
    if (activeId === noteId) {
      const next = remaining[0] ?? null
      if (next) selectNote(next)
      else { setActiveId(null); setTitle(''); setContent('') }
    }
  }

  async function handleSaveSnapshot() {
    if (!activeId) return
    setSaving(true)
    await saveNote(activeId, project.id, title, content, true)
    lastSaved.current = { title, content }
    setSaving(false)
    loadVersions(activeId)
  }

  async function loadVersions(noteId: string) {
    const result = await getNoteVersions(noteId)
    setVersions(result.versions ?? [])
    setShowHistory(true)
  }

  async function handleRestore(versionId: string) {
    if (!activeId) return
    const result = await restoreNoteVersion(activeId, versionId, project.id)
    if (result.error) return
    setTitle(result.title!)
    setContent(result.content!)
    setNotes(prev => prev.map(n => n.id === activeId ? { ...n, title: result.title!, content: result.content! } : n))
    lastSaved.current = { title: result.title!, content: result.content! }
    setDirty(false)
    setShowHistory(false)
  }

  return (
    <div className="flex flex-col h-full">
      <Topbar>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#838383]">
            {saving ? 'Saving…' : dirty ? 'Unsaved' : activeId ? 'Saved' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {activeId && (
            <>
              <div className="flex border border-[#e8e8e8] rounded overflow-hidden h-8">
                {(['write', 'mindmap'] as ViewMode[]).map(v => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-3 text-sm capitalize transition-colors ${view === v ? 'bg-[#063530] text-white' : 'bg-white text-[#333] hover:bg-[#f2f2f2]'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <button
                onClick={handleSaveSnapshot}
                className="flex items-center gap-1.5 border border-[#e8e8e8] bg-white h-8 px-3 rounded text-sm text-[#333] hover:bg-[#f2f2f2] cursor-pointer"
                title="Save snapshot"
              >
                <History size={13} className="text-[#838383]" />
                Snapshot
              </button>
            </>
          )}
          <button
            onClick={() => router.push(`/projects/${project.id}`)}
            className="flex items-center gap-2 bg-[#f2f2f2] border border-[#838383] h-8 px-3 rounded cursor-pointer"
          >
            <ChevronLeft size={13} className="text-[#242424]" />
            <span className="text-sm text-[#242424]">Board</span>
          </button>
        </div>
      </Topbar>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-56 shrink-0 border-r border-[#e8e8e8] flex flex-col bg-[#fafafa]">
          <div className="px-4 h-[52px] flex items-center justify-between border-b border-[#e8e8e8] shrink-0">
            <span className="font-semibold text-[#242424] text-sm">My Notes</span>
            <button
              onClick={handleCreate}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#efefef] transition-colors cursor-pointer"
              title="New note"
            >
              <Plus size={14} className="text-[#242424]" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {notes.length === 0 && (
              <p className="px-4 py-3 text-xs text-[#838383]">No notes yet.</p>
            )}
            {notes.map(note => (
              <div
                key={note.id}
                onClick={() => selectNote(note)}
                className={`group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                  activeId === note.id ? 'bg-[#063530]' : 'hover:bg-[#efefef]'
                }`}
              >
                <FileText size={13} className={activeId === note.id ? 'text-white shrink-0' : 'text-[#838383] shrink-0'} />
                <span className={`flex-1 text-sm truncate ${activeId === note.id ? 'text-white' : 'text-[#242424]'}`}>
                  {note.title || 'Untitled'}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(note.id) }}
                  className={`shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${activeId === note.id ? 'text-white hover:text-red-300' : 'text-[#838383] hover:text-red-500'}`}
                  title="Delete note"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Editor area */}
        {!activeId ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[#838383]">
            <FileText size={32} className="text-[#e8e8e8]" />
            <p className="text-sm">Select a note or create a new one</p>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 bg-[#242424] h-8 px-4 rounded text-[#d3d3d3] text-sm cursor-pointer"
            >
              <Plus size={12} />
              New note
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Title */}
            <div className="px-8 pt-6 pb-3 border-b border-[#e8e8e8] shrink-0">
              <input
                value={title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="Note title"
                className="w-full text-xl font-semibold text-[#242424] bg-transparent outline-none placeholder:text-[#c0c0c0]"
              />
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {view === 'write' && (
                <RichTextEditor
                  noteId={activeId!}
                  content={content}
                  onChange={handleContentChange}
                />
              )}

              {view === 'mindmap' && (
                <div className="flex-1 overflow-hidden">
                  <Mindmap content={content} />
                </div>
              )}
            </div>

            {/* Version history panel */}
            {showHistory && (
              <div className="absolute top-0 right-0 bottom-0 w-72 bg-white border-l border-[#e8e8e8] flex flex-col shadow-lg z-10">
                <div className="px-4 h-[52px] flex items-center justify-between border-b border-[#e8e8e8] shrink-0">
                  <span className="font-semibold text-sm text-[#242424]">Version history</span>
                  <button onClick={() => setShowHistory(false)} className="text-[#838383] hover:text-[#242424]">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto py-2">
                  {versions.length === 0 && (
                    <p className="px-4 py-3 text-xs text-[#838383]">No snapshots yet. Click "Snapshot" to save one.</p>
                  )}
                  {versions.map(v => (
                    <div key={v.id} className="flex items-center justify-between px-4 py-2 hover:bg-[#f9f9f9] gap-2">
                      <div>
                        <p className="text-sm text-[#242424] truncate">{v.title || 'Untitled'}</p>
                        <p className="text-xs text-[#838383]">
                          {new Date(v.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRestore(v.id)}
                        className="shrink-0 text-[#063530] hover:text-[#0a5248] transition-colors"
                        title="Restore this version"
                      >
                        <RotateCcw size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
