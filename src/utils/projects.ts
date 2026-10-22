export type ProjectSortKey = 'alphabetical' | 'tasks' | 'deadline' | 'progress'

type Member      = { id: string; name: string | null; email: string | null }
type Project     = { id: string; name: string; code: string; planned_end: string | null }
export type ProjectStat = { total: number; done: number; members: Member[] }

const EMPTY_STAT: ProjectStat = { total: 0, done: 0, members: [] }

// "Database Migration Tool" → "DMT"
export function projectInitials(name: string): string {
  return name.split(/\s+/).filter(Boolean).map(w => w[0].toUpperCase()).join('')
}

// Next project code for some initials, e.g. "DMT" with "DMT-002" → "DMT-003".
export function nextProjectCode(initials: string, existingCodes: string[]): string {
  const nums = existingCodes
    .map(code => parseInt(code.slice(initials.length + 1), 10))
    .filter(n => !isNaN(n))
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1
  return `${initials}-${String(next).padStart(3, '0')}`
}

export function sortProjects<T extends Project>(
  projects: T[],
  projectStats: Record<string, ProjectStat>,
  sort: ProjectSortKey,
  search: string,
): T[] {
  const q = search.toLowerCase()
  const base = search
    ? projects.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q))
    : projects
  return [...base].sort((a, b) => {
    const sa = projectStats[a.id] ?? EMPTY_STAT
    const sb = projectStats[b.id] ?? EMPTY_STAT
    switch (sort) {
      case 'alphabetical':
        return a.name.localeCompare(b.name)
      case 'tasks':
        return sb.total - sa.total
      case 'deadline': {
        if (!a.planned_end && !b.planned_end) return 0
        if (!a.planned_end) return 1
        if (!b.planned_end) return -1
        return a.planned_end.localeCompare(b.planned_end)
      }
      case 'progress': {
        const ra = sa.total > 0 ? sa.done / sa.total : 0
        const rb = sb.total > 0 ? sb.done / sb.total : 0
        return rb - ra
      }
    }
  })
}

// Per-project task totals, done counts and member lists for the projects board.
export function buildProjectStats(
  projects: { id: string }[],
  tasks: { project_id: string; stage: string }[],
  projectMembers: { project_id: string; profiles: Member | Member[] | null }[],
): Record<string, ProjectStat> {
  const stats: Record<string, ProjectStat> = {}

  for (const p of projects) {
    stats[p.id] = { total: 0, done: 0, members: [] }
  }
  for (const t of tasks) {
    if (stats[t.project_id]) {
      stats[t.project_id].total++
      if (t.stage === 'done') stats[t.project_id].done++
    }
  }
  for (const pm of projectMembers) {
    const profile = pm.profiles as Member | null
    if (stats[pm.project_id] && profile) {
      stats[pm.project_id].members.push(profile)
    }
  }

  return stats
}
