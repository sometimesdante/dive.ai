'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Settings, ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import ProjectCard from '@/ui/base/ProjectCard'
import CreateProjectPanel from '@/ui/dive/CreateProjectPanel'
import Topbar from '@/ui/dive/Topbar'
import { X } from 'lucide-react'
import { createTask, updateTaskStage } from '@/app/(dive)/projects/actions'
import { createClient } from '@/utils/supabase/client'

type Project = { id: string; name: string; code: string }

type Task = {
  id: string
  project_id: string
  name: string
  code: string
  status: 'default' | 'overdue' | 'approaching' | 'on-track'
  stage: 'backlog' | 'todo' | 'doing' | 'done'
  position: number
}

type Member      = { id: string; name: string | null; email: string | null }
type Cluster     = { id: string; name: string }
type DropTarget  = { stage: Task['stage']; index: number } | null
type ProjectStat = { total: number; done: number; members: Member[] }

type ColumnDef = {
  label: string
  stage: Task['stage']
  indicator: 'gray' | 'yellow' | 'orange' | 'green'
}

const columns: ColumnDef[] = [
  { label: 'Backlogs', stage: 'backlog', indicator: 'gray'   },
  { label: 'To do',   stage: 'todo',    indicator: 'yellow' },
  { label: 'Doing',   stage: 'doing',   indicator: 'orange' },
  { label: 'Done',    stage: 'done',    indicator: 'green'  },
]

const indicatorPills: Record<string, { filled: number; color: string }> = {
  gray:   { filled: 0, color: '' },
  yellow: { filled: 1, color: 'bg-[#f1c21b]' },
  orange: { filled: 2, color: 'bg-[#ff832b]' },
  green:  { filled: 3, color: 'bg-[#14b8a6]' },
}

function ColumnIndicator({ color }: { color: 'gray' | 'yellow' | 'orange' | 'green' }) {
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
  projects: Project[]
  members: Member[]
  clusters: Cluster[]
  currentUserId: string
  projectStats: Record<string, ProjectStat>
}

export default function ProjectsBoard({ projects, members, clusters, currentUserId, projectStats }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [tasks, setTasks]                         = useState<Task[]>([])
  const [loadingTasks, setLoadingTasks]           = useState(false)
  const [search, setSearch]                       = useState('')
  const [panelOpen, setPanelOpen]                 = useState(false)
  const [inlineCreateStage, setInlineCreateStage] = useState<Task['stage'] | null>(null)
  const [draggedId, setDraggedId]                 = useState<string | null>(null)
  const [dropTarget, setDropTarget]               = useState<DropTarget>(null)

  const selectedProject = projects.find(p => p.id === selectedProjectId) ?? null

  useEffect(() => {
    setLoadingTasks(true)
    const query = supabase.from('tasks').select('*').order('position', { ascending: true })
    const filtered = selectedProjectId
      ? query.eq('project_id', selectedProjectId)
      : query.eq('owner_id', currentUserId)
    filtered.then(({ data }) => {
      setTasks(data ?? [])
      setLoadingTasks(false)
    })
  }, [selectedProjectId])

  const filtered = tasks.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.code.toLowerCase().includes(search.toLowerCase())
  )

  // ── Drag handlers ──────────────────────────────────────
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

    setTasks(prev =>
      prev.map(t => t.id === draggedId ? { ...t, stage, position: newPosition } : t)
        .sort((a, b) => a.position - b.position)
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

  // ── Create task ────────────────────────────────────────
  const [taskName, setTaskName]   = useState('')
  const [taskCode, setTaskCode]     = useState('')
  const [taskOwner, setTaskOwner]   = useState('')
  const [taskStage, setTaskStage]   = useState<Task['stage']>('backlog')
  const [taskStatus, setTaskStatus] = useState<Task['status']>('on-track')
  const [taskError, setTaskError]       = useState<string | null>(null)
  const [taskSaving, setTaskSaving]     = useState(false)

  function generateTaskCode(): string {
    if (!selectedProject) return ''
    const prefix = selectedProject.code + '-'
    const nums = tasks
      .filter(t => t.project_id === selectedProjectId && t.code.startsWith(prefix))
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
    if (!selectedProjectId) return
    setTaskSaving(true)
    setTaskError(null)
    const fd = new FormData()
    fd.set('name', taskName)
    fd.set('code', taskCode)
    fd.set('owner_id', taskOwner)
    fd.set('stage', taskStage)
    fd.set('status', taskStatus)
    const result = await createTask(selectedProjectId, fd)
    setTaskSaving(false)
    if (result?.error) { setTaskError(result.error); return }
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', selectedProjectId)
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
        <div className="flex items-center gap-2">
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
        </div>

        <div className="flex items-center gap-2">
          {selectedProject && (
            <button
              onClick={() => router.push(`/projects/${selectedProject.id}/settings`)}
              className="flex items-center gap-2 bg-[#f2f2f2] border border-[#838383] h-8 px-3 rounded cursor-pointer"
            >
              <span className="text-[#242424]">Settings</span>
              <Settings size={12} className="text-[#242424]" />
            </button>
          )}
          <button
            onClick={() => setPanelOpen(true)}
            className="flex items-center gap-2 bg-[#242424] h-8 px-3 rounded cursor-pointer shrink-0 whitespace-nowrap"
          >
            <span className="text-[#d3d3d3]">Create project</span>
            <Plus size={12} className="text-[#d3d3d3]" />
          </button>
        </div>
      </Topbar>

      {/* Project header */}
      {selectedProject && (
        <div className="flex items-center gap-3 px-6 pt-5 pb-1 shrink-0">
          <button
            onClick={() => setSelectedProjectId('')}
            className="flex items-center justify-center w-[42px] h-[42px] bg-[#f2f2f2] hover:bg-[#e8e8e8] transition-colors cursor-pointer rounded"
          >
            <ChevronLeft size={16} className="md:hidden" />
            <ChevronLeft size={24} className="hidden md:block" />
          </button>
          <h2>{selectedProject.name}</h2>
        </div>
      )}

      {/* Body */}
      {!selectedProjectId ? (
        <div className="flex-1 overflow-y-auto p-6">
          {projects.length === 0 ? (
            <p className="text-[#838383]">No projects yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {projects.map(p => {
                const stat = projectStats[p.id] ?? { total: 0, done: 0, members: [] }
                const rate = stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    className="bg-white shadow-[2px_4px_8px_0px_rgba(0,0,0,0.12)] p-4 flex flex-col gap-2.5 text-left hover:shadow-[2px_6px_16px_0px_rgba(0,0,0,0.16)] transition-shadow"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="bg-[#f2f2f2] text-black text-xs px-2 py-0.5 rounded-full shrink-0">{p.code}</span>
                      {stat.members.length > 0 && (
                        <div className="flex items-center gap-1">
                          {stat.members.slice(0, 5).map(m => (
                            <div
                              key={m.id}
                              title={m.name ?? m.email ?? ''}
                              className="w-5 h-5 rounded-full bg-[#063530] text-white text-xs flex items-center justify-center shrink-0 uppercase"
                            >
                              {(m.name ?? m.email ?? '?')[0]}
                            </div>
                          ))}
                          {stat.members.length > 5 && (
                            <span className="text-xs text-[#838383]">+{stat.members.length - 5}</span>
                          )}
                        </div>
                      )}
                    </div>

                    <span className="text-black font-medium leading-tight flex-1">{p.name}</span>

                    <div className="flex flex-col gap-1 mt-auto">
                      <div className="flex justify-between text-xs text-[#838383]">
                        <span>{stat.total} task{stat.total !== 1 ? 's' : ''}</span>
                        <span>{rate}% done</span>
                      </div>
                      <div className="h-1 w-full bg-[#e8e8e8] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#14b8a6] rounded-full transition-all"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ) : loadingTasks ? (
        <div className="flex-1 flex items-center justify-center text-[#838383]">Loading…</div>
      ) : (
        // Kanban board
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
          <div className="flex gap-4 h-full min-w-[640px]">
            {columns.map((col) => {
              const cards    = filtered.filter(t => t.stage === col.stage)
              const isOver   = dropTarget?.stage === col.stage

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
                          <ProjectCard
                            text={task.name}
                            projectCode={task.code}
                            status={task.status}
                            draggable
                            isDragging={draggedId === task.id}
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            onDragEnd={handleDragEnd}
                          />
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

                  {selectedProject && (
                    inlineCreateStage === col.stage ? (
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
                        <div className="flex gap-2">
                          <select
                            value={taskOwner}
                            onChange={e => setTaskOwner(e.target.value)}
                            className="bg-white border border-[#c7c7c7] h-8 px-2 rounded text-black outline-none flex-1 text-sm"
                          >
                            <option value="">— none —</option>
                            {members.map(m => (
                              <option key={m.id} value={m.id}>{m.name ?? m.email ?? ''}</option>
                            ))}
                          </select>
                        </div>
                        <select
                          value={taskStatus}
                          onChange={e => setTaskStatus(e.target.value as Task['status'])}
                          className="bg-white border border-[#c7c7c7] h-8 px-2 rounded text-black outline-none w-full text-sm"
                        >
                          <option value="default">No status</option>
                          <option value="on-track">On track</option>
                          <option value="approaching">Approaching</option>
                          <option value="overdue">Overdue</option>
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
                    )
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Create project panel */}
      <CreateProjectPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        clusters={clusters}
        members={members}
        currentUserId={currentUserId}
      />

    </div>
  )
}
