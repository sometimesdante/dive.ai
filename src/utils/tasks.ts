export type TaskStage  = 'backlog' | 'todo' | 'doing' | 'done'
export type TaskStatus = 'default' | 'overdue' | 'approaching' | 'on-track' | 'complete'
export type TaskSortKey = 'manual' | 'alphabetical' | 'status' | 'assignee'

type SortableTask = { name: string; code: string; status: TaskStatus; owner_id: string | null }
type Member       = { id: string; name: string | null; email: string | null }

export const STATUS_ORDER: Record<TaskStatus, number> = {
  overdue:     0,
  approaching: 1,
  'on-track':  2,
  default:     3,
  complete:    4,
}

// Fractional position for a card inserted at `insertIndex` in a column
// ordered by position, so a move only ever updates one row.
export function computePosition(tasks: { position: number }[], insertIndex: number): number {
  if (tasks.length === 0) return 1
  if (insertIndex === 0) return tasks[0].position - 1
  if (insertIndex >= tasks.length) return tasks[tasks.length - 1].position + 1
  return (tasks[insertIndex - 1].position + tasks[insertIndex].position) / 2
}

// Position for a card dropped at `dropIndex` in a column as rendered, where
// the column may still contain the card being dragged.
export function dropPosition(
  columnTasks: { id: string; position: number }[],
  draggedId: string,
  dropIndex: number,
): number {
  const targetTasks = columnTasks.filter(t => t.id !== draggedId)
  const insertIndex = Math.min(dropIndex, targetTasks.length)
  return computePosition(targetTasks, insertIndex)
}

// Status a task takes on when it is dragged into a stage.
export function statusForStage(stage: string): TaskStatus {
  return stage === 'done' ? 'complete' : stage === 'doing' ? 'on-track' : 'default'
}

// Next task code for a project, e.g. project "EDC-001" with "EDC-T004" → "EDC-T005".
export function nextTaskCode(projectCode: string, existingCodes: string[]): string {
  const prefix = projectCode.replace(/-?\d+$/, '') + '-T'
  const nums = existingCodes
    .filter(c => c.startsWith(prefix))
    .map(c => parseInt(c.slice(prefix.length), 10))
    .filter(n => !isNaN(n))
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1
  return `${prefix}${String(next).padStart(3, '0')}`
}

export function filterAndSortTasks<T extends SortableTask>(
  tasks: T[],
  search: string,
  sort: TaskSortKey,
  members: Member[],
): T[] {
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
        const na = ma ? (ma.name ?? ma.email ?? '') : '￿'
        const nb = mb ? (mb.name ?? mb.email ?? '') : '￿'
        return na.localeCompare(nb)
      }
    }
  })
}
