'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Plus, Search, Settings, ChevronLeft, MoreHorizontal, X, ArrowUpDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import ProjectCard from '@/ui/base/ProjectCard'
import Topbar from '@/ui/dive/Topbar'
import { createTask, updateTask, deleteTask, updateTaskStage } from '@/app/(dive)/projects/actions'
import { createClient } from '@/utils/supabase/client'

type Project = { id: string; name: string; code: string }

type Task = {
  id: string
  project_id: string
  owner_id: string | null
  name: string
  code: string
  status: 'default' | 'overdue' | 'approaching' | 'on-track' | 'complete'
  stage: 'backlog' | 'todo' | 'doing' | 'done'
  position: number
}

type Member     = { id: string; name: string | null; email: string | null }
type DropTarget = { stage: Task['stage']; index: number } | null
type SortKey    = 'manual' | 'alphabetical' | 'status' | 'assignee'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'manual',       label: 'Manual'       },
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'status',       label: 'Status'       },
  { value: 'assignee',     label: 'Assignee'     },
]

const STATUS_ORDER: Record<Task['status'], number> = {
  overdue:    0,
  approaching: 1,
  'on-track': 2,
  default:    3,
  complete:   4,
}

type ColumnDef = {
  label: string
  stage: Task['stage']
  indicator: 'gray' | 'lightgray' | 'darkgray' | 'green'
}

const columns: ColumnDef[] = [
  { label: 'Backlogs', stage: 'backlog', indicator: 'gray'      },
  { label: 'To do',   stage: 'todo',    indicator: 'lightgray'  },
  { label: 'Doing',   stage: 'doing',   indicator: 'darkgray'   },
  { label: 'Done',    stage: 'done',    indicator: 'green'      },
]

const indicatorPills: Record<string, { filled: number; color: string }> = {
  gray:      { filled: 0, color: '' },
  lightgray: { filled: 1, color: 'bg-[#ababab]' },
  darkgray:  { filled: 2, color: 'bg-[#ababab]' },
  green:     { filled: 3, color: 'bg-[#14b8a6]' },
}

function ColumnIndicator({ color }: { color: ColumnDef['indicator'] }) {
  const { filled, color: activeColor } = indicatorPills[color]
  return (
    <div className="flex gap-1">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`w-3 h-3 rounded-full border border-[#d3d3d3] ${i <= filled ? `${activeColor} border-transparent` : ''}`} />
      ))}
    </div>
  )
}

function computePosition(tasks: Task[], insertIndex: number): number {
  if (tasks.length === 0) return 1
  if (insertIndex === 0) return tasks[0].position - 1
  if (insertIndex >= tasks.length) return tasks[tasks.length - 1].position + 1
  return (tasks[insertIndex - 1].position + tasks[insertIndex].position) / 2
}

type Props = {
  project: Project
  initialTasks: Task[]
  members: Member[]
  currentUserId: string
}

export default function ProjectBoard({ project, initialTasks, members, currentUserId }: Props) {
  const router  = useRouter()
  const supabase = createClient()

  const [tasks, setTasks]                         = useState<Task[]>(initialTasks)
  const [search, setSearch]                       = useState('')
  const [inlineCreateStage, setInlineCreateStage] = useState<Task['stage'] | null>(null)
  const [draggedId, setDraggedId]                 = useState<string | null>(null)
  const [dropTarget, setDropTarget]               = useState<DropTarget>(null)
  const [menuOpenId, setMenuOpenId]               = useState<string | null>(null)
  const [sort, setSort]                           = useState<SortKey>('manual')
  const [sortOpen, setSortOpen]                   = useState(false)
  const [editingTaskId, setEditingTaskId]         = useState<string | null>(null)
  const [editName, setEditName]                   = useState('')
  const [editOwner, setEditOwner]                 = useState('')
  const [editStatus, setEditStatus]               = useState<Task['status']>('default')
  const [editSaving, setEditSaving]               = useState(false)
  const [editError, setEditError]                 = useState<string | null>(null)

  const [taskName, setTaskName]     = useState('')
  const [taskCode, setTaskCode]     = useState('')
  const [taskOwner, setTaskOwner]   = useState('')
  const [taskStage, setTaskStage]   = useState<Task['stage']>('backlog')
  const [taskStatus, setTaskStatus] = useState<Task['status']>('on-track')
  const [taskError, setTaskError]   = useState<string | null>(null)
  const [taskSaving, setTaskSaving] = useState(false)

  const completionSound = useRef<HTMLAudioElement | null>(null)
  useEffect(() => {
    completionSound.current = new Audio('/notifications/7_eleven.mp3')
  }, [])

  function playCompletionSound() {
    completionSound.current?.play().catch(() => {})
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const base = tasks.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.code.toLowerCase().includes(q)
    )
    if (sort === 'manual') return base
    return [...base].sort((a, b) => {
      switch (sort) {
        case 'alphabetical':
          return a.name.localeCompare(b.name)
        case 'status':
          return STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
        case 'assignee': {
          const ma = members.find(m => m.id === a.owner_id)
          const mb = members.find(m => m.id === b.owner_id)
          const na = ma ? (ma.name ?? ma.email ?? '') : '\uFFFF'
          const nb = mb ? (mb.name ?? mb.email ?? '') : '\uFFFF'
          return na.localeCompare(nb)
        }
      }
    })
  }, [tasks, search, sort, members])

  // ── Drag handlers ───────────────────────────────────────
  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragEnd() {
    setDraggedId(null)
    setDropTarget(null)
  }

  function handleCardDragOver(e: React.DragEvent, stage: Task['stage'], index: number) {
    e.preventDefault()
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setDropTarget({ stage, index: e.clientY < rect.top + rect.height / 2 ? index : index + 1 })
  }

  function handleColumnDragOver(e: React.DragEvent, stage: Task['stage'], cardCount: number) {
    e.preventDefault()
    setDropTarget(prev => prev?.stage === stage ? prev : { stage, index: cardCount })
  }

  async function handleDrop(e: React.DragEvent, stage: Task['stage'], columnTasks: Task[]) {
    e.preventDefault()
    if (!draggedId || !dropTarget) return

    const dragged = tasks.find(t => t.id === draggedId)
    if (!dragged) return

    const targetTasks  = columnTasks.filter(t => t.id !== draggedId)
    const insertIndex  = Math.min(dropTarget.index, targetTasks.length)
    const newPosition  = computePosition(targetTasks, insertIndex)
    const prevStage    = dragged.stage
    const prevPosition = dragged.position

    if (stage === 'done' && dragged.stage !== 'done') playCompletionSound()
    setTasks(prev =>
      prev.map(t => t.id === draggedId
        ? { ...t, stage, position: newPosition, status: (stage === 'done' ? 'complete' : stage === 'doing' ? 'on-track' : 'default') as Task['status'] }
        : t
      ).sort((a, b) => a.position - b.position)
    )
    setDraggedId(null)
    setDropTarget(null)

    const result = await updateTaskStage(draggedId, stage, newPosition)
    if (result?.error) {
      setTasks(prev =>
        prev.map(t => t.id === draggedId ? { ...t, stage: prevStage, position: prevPosition } : t)
          .sort((a, b) => a.position - b.position)
      )
    }
  }

  // ── Edit / delete ───────────────────────────────────────
  function openEditTask(task: Task) {
    setEditingTaskId(task.id)
    setEditName(task.name)
    setEditOwner(task.owner_id ?? '')
    setEditStatus(task.status)
    setEditError(null)
  }

  async function handleSaveEdit(e: React.FormEvent, taskId: string) {
    e.preventDefault()
    setEditSaving(true)
    setEditError(null)
    const fd = new FormData()
    fd.set('name', editName)
    fd.set('owner_id', editOwner)
    fd.set('status', editStatus)
    const result = await updateTask(taskId, fd)
    setEditSaving(false)
    if (result?.error) { setEditError(result.error); return }
    const prevTask = tasks.find(t => t.id === taskId)
    if (editStatus === 'complete' && prevTask?.status !== 'complete') playCompletionSound()
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, name: editName, owner_id: editOwner || null, status: editStatus } : t))
    setEditingTaskId(null)
  }

  async function handleDeleteTask(taskId: string) {
    setTasks(prev => prev.filter(t => t.id !== taskId))
    setMenuOpenId(null)
    await deleteTask(taskId)
  }

  // ── Create task ─────────────────────────────────────────
  function generateTaskCode(): string {
    const prefix = project.code.replace(/-?\d+$/, '') + '-T'
    const nums = tasks
      .filter(t => t.project_id === project.id && t.code.startsWith(prefix))
      .map(t => parseInt(t.code.slice(prefix.length), 10))
      .filter(n => !isNaN(n))
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1
    return `${prefix}${String(next).padStart(3, '0')}`
  }

  function openCreateTask(stage: Task['stage'] = 'backlog') {
    setTaskStage(stage)
    setTaskCode(generateTaskCode())
    setTaskOwner(currentUserId)
    setInlineCreateStage(stage)
  }

  async function handleCreateTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setTaskSaving(true)
    setTaskError(null)
    const fd = new FormData()
    fd.set('name', taskName)
    fd.set('code', taskCode)
    fd.set('owner_id', taskOwner)
    fd.set('stage', taskStage)
    fd.set('status', taskStatus)
    const result = await createTask(project.id, fd)
    setTaskSaving(false)
    if (result?.error) { setTaskError(result.error); return }
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', project.id)
      .order('position', { ascending: true })
    setTasks(data ?? [])
    setTaskName('')
    setTaskCode('')
    setTaskOwner(currentUserId)
    setTaskStatus('on-track')
    setInlineCreateStage(null)
  }

  return (
    <div className="flex flex-col h-full">
      <Topbar>
        <div className="flex items-center gap-2 bg-white border border-[#e8e8e8] h-8 px-3 rounded w-60">
          <Search size={12} className="text-[#838383] shrink-0" />
          <input
            type="search"
            placeholder="Search tasks"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-black w-full outline-none bg-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setSortOpen(o => !o)}
              className="flex items-center gap-2 border border-[#e8e8e8] bg-white h-8 px-3 rounded cursor-pointer"
            >
              <ArrowUpDown size={12} className="text-[#838383]" />
              <span className="text-sm text-[#333]">{SORT_OPTIONS.find(o => o.value === sort)?.label}</span>
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-[#e8e8e8] shadow-md z-20 min-w-[140px]">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setSort(opt.value); setSortOpen(false) }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-[#f2f2f2] transition-colors ${sort === opt.value ? 'text-[#242424] font-medium' : 'text-[#333]'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => router.push(`/projects/${project.id}/settings`)}
            className="flex items-center gap-2 bg-[#f2f2f2] border border-[#838383] h-8 px-3 rounded cursor-pointer"
          >
            <span className="text-[#242424]">Settings</span>
            <Settings size={12} className="text-[#242424]" />
          </button>
        </div>
      </Topbar>

      {/* Project header */}
      <div className="flex items-center gap-3 px-6 pt-5 pb-1 shrink-0">
        <button
          onClick={() => router.push('/projects')}
          className="flex items-center justify-center w-[42px] h-[42px] bg-[#f2f2f2] hover:bg-[#e8e8e8] transition-colors cursor-pointer rounded"
        >
          <ChevronLeft size={24} />
        </button>
        <h2>{project.name}</h2>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6" onClick={() => sortOpen && setSortOpen(false)}>
        <div className="flex gap-4 h-full min-w-[640px]">
          {columns.map((col) => {
            const cards  = filtered.filter(t => t.stage === col.stage)
            const isOver = dropTarget?.stage === col.stage

            return (
              <div
                key={col.stage}
                onDragOver={(e) => handleColumnDragOver(e, col.stage, cards.length)}
                onDrop={(e) => handleDrop(e, col.stage, cards)}
                className={`flex-1 min-w-[200px] flex flex-col overflow-y-auto px-3 py-2 -mx-3 rounded-lg transition-colors ${isOver ? 'bg-black/5' : ''}`}
              >
                <div className="flex items-center justify-between mb-4 shrink-0">
                  <h3 className="text-[#063530] font-semibold tracking-wide">{col.label}</h3>
                  <ColumnIndicator color={col.indicator} />
                </div>

                <div className="flex flex-col gap-2">
                  {cards.map((task, index) => (
                    <div key={task.id}>
                      {dropTarget?.stage === col.stage && dropTarget.index === index && (
                        <div className="h-0.5 bg-[#063530] rounded mb-2 opacity-60" />
                      )}
                      <div onDragOver={(e) => handleCardDragOver(e, col.stage, index)}>
                        {editingTaskId === task.id ? (
                          <form
                            onSubmit={(e) => handleSaveEdit(e, task.id)}
                            className="bg-white shadow-[2px_4px_8px_0px_rgba(0,0,0,0.12)] p-3 flex flex-col gap-2"
                          >
                            <input
                              autoFocus
                              required
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              placeholder="Task name"
                              className="bg-[#f2f2f2] border border-[#e8e8e8] h-8 px-3 rounded text-black outline-none w-full text-sm"
                            />
                            <select
                              value={editStatus}
                              onChange={e => setEditStatus(e.target.value as Task['status'])}
                              className="bg-white border border-[#c7c7c7] h-8 px-2 rounded text-black outline-none w-full text-sm"
                            >
                              <option value="default">No status</option>
                              <option value="on-track">On track</option>
                              <option value="approaching">Approaching</option>
                              <option value="overdue">Overdue</option>
                              <option value="complete">Complete</option>
                            </select>
                            <select
                              value={editOwner}
                              onChange={e => setEditOwner(e.target.value)}
                              className="bg-white border border-[#c7c7c7] h-8 px-2 rounded text-black outline-none w-full text-sm"
                            >
                              <option value="">— none —</option>
                              {members.map(m => (
                                <option key={m.id} value={m.id}>{m.name ?? m.email ?? ''}</option>
                              ))}
                            </select>
                            {editError && <p className="text-red-600 text-xs">{editError}</p>}
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                disabled={editSaving}
                                className="flex-1 bg-[#242424] h-8 rounded text-[#d3d3d3] text-sm cursor-pointer disabled:opacity-50"
                              >
                                {editSaving ? 'Saving…' : 'Save'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingTaskId(null)}
                                className="w-8 h-8 flex items-center justify-center bg-[#f2f2f2] rounded text-[#838383] hover:text-black transition-colors cursor-pointer"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="relative group">
                            <ProjectCard
                              text={task.name}
                              projectCode={task.code}
                              status={task.status}
                              draggable
                              isDragging={draggedId === task.id}
                              onDragStart={(e) => handleDragStart(e, task.id)}
                              onDragEnd={handleDragEnd}
                            />
                            <button
                              onMouseDown={e => e.stopPropagation()}
                              onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === task.id ? null : task.id) }}
                              className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center text-[#838383] hover:text-[#242424] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              <MoreHorizontal size={14} />
                            </button>
                            {menuOpenId === task.id && (
                              <div className="absolute top-7 right-1 z-10 bg-white shadow-[2px_4px_12px_0px_rgba(0,0,0,0.16)] rounded border border-[#e8e8e8] py-1 min-w-[100px]">
                                <button
                                  onClick={() => { openEditTask(task); setMenuOpenId(null) }}
                                  className="w-full text-left px-3 py-1.5 text-sm text-[#242424] hover:bg-[#f2f2f2] transition-colors cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-[#f2f2f2] transition-colors cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {dropTarget?.stage === col.stage && dropTarget.index === cards.length && (
                    <div className="h-0.5 bg-[#063530] rounded opacity-60" />
                  )}

                  {cards.length === 0 && !isOver && (
                    <p className="text-[#838383] px-3">No tasks</p>
                  )}
                </div>

                {inlineCreateStage === col.stage ? (
                  <form
                    onSubmit={handleCreateTask}
                    className="mt-2 shrink-0 bg-white shadow-[2px_4px_8px_0px_rgba(0,0,0,0.12)] p-3 flex flex-col gap-2"
                  >
                    <input
                      autoFocus
                      required
                      value={taskName}
                      onChange={e => setTaskName(e.target.value)}
                      placeholder="Task name"
                      className="bg-[#f2f2f2] border border-[#e8e8e8] h-8 px-3 rounded text-black outline-none w-full text-sm"
                    />
                    <select
                      value={taskStatus}
                      onChange={e => setTaskStatus(e.target.value as Task['status'])}
                      className="bg-white border border-[#c7c7c7] h-8 px-2 rounded text-black outline-none w-full text-sm"
                    >
                      <option value="default">No status</option>
                      <option value="on-track">On track</option>
                      <option value="approaching">Approaching</option>
                      <option value="overdue">Overdue</option>
                      <option value="complete">Complete</option>
                    </select>
                    <select
                      value={taskOwner}
                      onChange={e => setTaskOwner(e.target.value)}
                      className="bg-white border border-[#c7c7c7] h-8 px-2 rounded text-black outline-none w-full text-sm"
                    >
                      <option value="">— none —</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>{m.name ?? m.email ?? ''}</option>
                      ))}
                    </select>
                    {taskError && <p className="text-red-600 text-xs">{taskError}</p>}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={taskSaving}
                        className="flex-1 bg-[#242424] h-8 rounded text-[#d3d3d3] text-sm cursor-pointer disabled:opacity-50"
                      >
                        {taskSaving ? 'Creating…' : 'Create'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setInlineCreateStage(null)}
                        className="w-8 h-8 flex items-center justify-center bg-[#f2f2f2] rounded text-[#838383] hover:text-black transition-colors cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => openCreateTask(col.stage)}
                    className="mt-2 shrink-0 w-full flex items-center justify-center h-10 bg-white shadow-[2px_4px_8px_0px_rgba(0,0,0,0.12)] text-[#838383] hover:text-[#242424] transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
