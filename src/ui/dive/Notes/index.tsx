'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Plus, Trash2, FileText, ChevronLeft, ChevronDown, History, RotateCcw } from 'lucide-react'
import RichTextEditor from './RichTextEditor'
import { useRouter } from 'next/navigation'
import Topbar from '@/ui/dive/Topbar'
import {
  createNote,
  saveNote,
  deleteNote,
  getNoteVersions,
  restoreNoteVersion,
} from '@/app/(dive)/notes/actions'

const Mindmap = dynamic(() => import('./Mindmap'), { ssr: false })

type Note = { id: string; title: string; content: string; updated_at: string; project_id: string; project_name: string }
type Project = { id: string; name: string; code: string }
type Version = { id: string; title: string; created_at: string }
type ViewMode = 'write' | 'mindmap'

type Props = {
  initialNotes: Note[]
  // Set on a project's notes page: new notes go straight into this project
  // and the top bar links back to its board.
  project?: Project
  // Projects a new note can be added to, on the all-notes page.
  projects?: Project[]
}

const AUTOSAVE_MS = 2000

export default function NotesEditor({ initialNotes, project, projects = project ? [project] : [] }: Props) {
  const router = useRouter()
  const [notes, setNotes]               = useState<Note[]>(initialNotes)
  const [activeId, setActiveId]         = useState<string | null>(initialNotes[0]?.id ?? null)
  const [title, setTitle]               = useState(initialNotes[0]?.title ?? '')
  const [content, setContent]           = useState(initialNotes[0]?.content ?? '')
  const [view, setView]                 = useState<ViewMode>('write')
  const [saving, setSaving]             = useState(false)
  const [versions, setVersions]         = useState<Version[]>([])
  const [showHistory, setShowHistory]   = useState(false)
  // `dirty` means the editor has changes not yet saved successfully.
  const [dirty, setDirty]               = useState(false)
  const [saveError, setSaveError]       = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSaved = useRef<{ title: string; content: string } | null>(null)

  // Latest editor state, for callbacks that outlive the render that made them
  const latest = useRef({ activeId, title, content, dirty })
  useEffect(() => { latest.current = { activeId, title, content, dirty } })

  // Load note into editor
  function selectNote(note: Note) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    if (dirty && activeId) flushSave(activeId, title, content)
    setActiveId(note.id)
    setTitle(note.title)
    setContent(note.content)
    setDirty(false)
    setSaveError(false)
    lastSaved.current = { title: note.title, content: note.content }
    setShowHistory(false)
  }

  // Saves a note and reports whether it worked. The note only counts as
  // saved once the server confirms it.
  async function flushSave(id: string, t: string, c: string, snapshot = false): Promise<boolean> {
    if (!snapshot && lastSaved.current?.title === t && lastSaved.current?.content === c) return true
    setSaving(true)
    let ok: boolean
    try {
      ok = !(await saveNote(id, t, c, snapshot)).error
    } catch {
      ok = false
    }
    setSaving(false)
    setSaveError(!ok)
    if (!ok) return false

    setNotes(prev => prev.map(n => n.id === id ? { ...n, title: t, content: c } : n))
    // Only touch editor state if this note is still the one open; it stays
    // dirty if the user kept typing while the save was in flight.
    const now = latest.current
    if (now.activeId === id) {
      lastSaved.current = { title: t, content: c }
      setDirty(now.title !== t || now.content !== c)
    }
    return true
  }

  // Autosave
  useEffect(() => {
    if (!activeId || !dirty) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => flushSave(activeId, title, content), AUTOSAVE_MS)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [title, content, activeId, dirty])

  // Save pending edits when leaving the page instead of dropping them
  useEffect(() => () => {
    const { activeId, title, content, dirty } = latest.current
    if (activeId && dirty) saveNote(activeId, title, content)
  }, [])

  // Closing or reloading the tab can't wait for a save, so warn instead
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  function handleTitleChange(val: string) {
    setTitle(val)
    setDirty(true)
  }

  function handleContentChange(val: string) {
    setContent(val)
    setDirty(true)
  }

  async function handleCreate(projectId: string) {
    const target = projects.find(p => p.id === projectId)
    if (!target) return
    const result = await createNote(projectId)
    if (result.error || !result.id) return
    const newNote: Note = {
      id: result.id,
      title: 'Untitled',
      content: '',
      updated_at: new Date().toISOString(),
      project_id: projectId,
      project_name: target.name,
    }
    setNotes(prev => [newNote, ...prev])
    selectNote(newNote)
  }

  async function handleDelete(noteId: string) {
    await deleteNote(noteId)
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
    if (saveTimer.current) clearTimeout(saveTimer.current)
    if (await flushSave(activeId, title, content, true)) loadVersions(activeId)
  }

  async function loadVersions(noteId: string) {
    const result = await getNoteVersions(noteId)
    setVersions(result.versions ?? [])
    setShowHistory(true)
  }

  async function handleRestore(versionId: string) {
    if (!activeId) return
    const result = await restoreNoteVersion(activeId, versionId)
    if (result.error) return
    setTitle(result.title!)
    setContent(result.content!)
    setNotes(prev => prev.map(n => n.id === activeId ? { ...n, title: result.title!, content: result.content! } : n))
    lastSaved.current = { title: result.title!, content: result.content! }
    setDirty(false)
    setSaveError(false)
    setShowHistory(false)
  }

  return (
    <div className="flex flex-col h-full">
      <Topbar>
        <div className="flex items-center gap-2">
          {saveError && !saving ? (
            <span className="text-sm text-red-600" title="Your changes are kept here and will be saved again on your next edit.">
              Couldn&apos;t save
            </span>
          ) : (
            <span className="text-sm text-[#838383]">
              {saving ? 'Saving…' : dirty ? 'Unsaved' : activeId ? 'Saved' : ''}
            </span>
          )}
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
          {project && (
            <button
              onClick={() => router.push(`/projects/${project.id}`)}
              className="flex items-center gap-2 bg-[#f2f2f2] border border-[#838383] h-8 px-3 rounded cursor-pointer"
            >
              <ChevronLeft size={13} className="text-[#242424]" />
              <span className="text-sm text-[#242424]">Board</span>
            </button>
          )}
        </div>
      </Topbar>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-56 shrink-0 border-r border-[#e8e8e8] flex flex-col bg-[#fafafa]">
          <div className="px-4 h-[52px] flex items-center justify-between border-b border-[#e8e8e8] shrink-0">
            <span className="font-semibold text-[#242424] text-sm">My Notes</span>
            <NewNoteButton variant="icon" project={project} projects={projects} onCreate={handleCreate} />
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
                {project ? (
                  <span className={`flex-1 text-sm truncate ${activeId === note.id ? 'text-white' : 'text-[#242424]'}`}>
                    {note.title || 'Untitled'}
                  </span>
                ) : (
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${activeId === note.id ? 'text-white' : 'text-[#242424]'}`}>
                      {note.title || 'Untitled'}
                    </p>
                    <p className={`text-xs truncate ${activeId === note.id ? 'text-[#a8ccc9]' : 'text-[#aaaaaa]'}`}>
                      {note.project_name}
                    </p>
                  </div>
                )}
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
            <NewNoteButton variant="primary" project={project} projects={projects} onCreate={handleCreate} />
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
                    <p className="px-4 py-3 text-xs text-[#838383]">No snapshots yet. Click &quot;Snapshot&quot; to save one.</p>
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

// ─── New note button ──────────────────────────────────────────────────────────
// Creates straight into `project` when there is one; otherwise opens a picker
// of `projects` to choose where the note goes.

type NewNoteButtonProps = {
  variant: 'icon' | 'primary'
  project?: Project
  projects: Project[]
  onCreate: (projectId: string) => void
}

function NewNoteButton({ variant, project, projects, onCreate }: NewNoteButtonProps) {
  const [open, setOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Close the picker on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  if (!project && projects.length === 0) return null

  const button = variant === 'icon' ? (
    <button
      onClick={() => project ? onCreate(project.id) : setOpen(v => !v)}
      className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#efefef] transition-colors cursor-pointer"
      title="New note"
    >
      <Plus size={14} className="text-[#242424]" />
    </button>
  ) : (
    <button
      onClick={() => project ? onCreate(project.id) : setOpen(v => !v)}
      className="flex items-center gap-2 bg-[#242424] h-8 px-4 rounded text-[#d3d3d3] text-sm cursor-pointer"
    >
      <Plus size={12} />
      New note
      {!project && <ChevronDown size={12} />}
    </button>
  )

  if (project) return button

  return (
    <div className="relative" ref={pickerRef}>
      {button}
      {open && (
        <div className={`absolute z-20 w-48 bg-white border border-[#e8e8e8] rounded shadow-md py-1 ${variant === 'icon' ? 'right-0 top-8' : 'left-0 top-10'}`}>
          <p className="px-3 py-1.5 text-xs text-[#838383] border-b border-[#f0f0f0]">
            {variant === 'icon' ? 'Add note to project' : 'Select project'}
          </p>
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => { setOpen(false); onCreate(p.id) }}
              className="w-full text-left px-3 py-2 text-sm text-[#242424] hover:bg-[#f5f5f5] flex items-center gap-2 cursor-pointer"
            >
              <span className="text-xs text-[#838383] font-mono uppercase">{p.code}</span>
              <span className="truncate">{p.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
