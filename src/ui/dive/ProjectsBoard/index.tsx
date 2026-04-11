'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Plus, ArrowUpDown, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Topbar from '@/ui/dive/Topbar'

const CreateProjectPanel = dynamic(() => import('@/ui/dive/CreateProjectPanel'))

type Project  = { id: string; name: string; code: string; planned_end: string | null }
type Member   = { id: string; name: string | null; email: string | null }
type Cluster  = { id: string; name: string }
type ProjectStat = { total: number; done: number; members: Member[] }

type SortKey = 'alphabetical' | 'tasks' | 'deadline' | 'progress'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'tasks',        label: 'No. of tasks'  },
  { value: 'deadline',     label: 'Deadline'       },
  { value: 'progress',     label: 'Progress'       },
]

type Props = {
  projects: Project[]
  members: Member[]
  clusters: Cluster[]
  currentUserId: string
  projectStats: Record<string, ProjectStat>
}

export default function ProjectsBoard({ projects, members, clusters, currentUserId, projectStats }: Props) {
  const router = useRouter()
  const [panelOpen, setPanelOpen] = useState(false)
  const [search, setSearch]       = useState('')
  const [sort, setSort]           = useState<SortKey>('alphabetical')
  const [sortOpen, setSortOpen]   = useState(false)

  const sorted = useMemo(() => {
    const q = search.toLowerCase()
    const base = search
      ? projects.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q))
      : projects
    return [...base].sort((a, b) => {
      const sa = projectStats[a.id] ?? { total: 0, done: 0, members: [] }
      const sb = projectStats[b.id] ?? { total: 0, done: 0, members: [] }
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
  }, [projects, projectStats, sort, search])

  return (
    <div className="flex flex-col h-full">
      <Topbar>
        <div className="flex items-center gap-2 bg-white border border-[#e8e8e8] h-8 px-3 rounded w-60">
          <Search size={12} className="text-[#838383] shrink-0" />
          <input
            type="search"
            placeholder="Search projects"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="text-black w-full outline-none bg-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setSortOpen(o => !o)}
              className="flex items-center gap-2 border border-[#e8e8e8] bg-white h-8 px-3 rounded cursor-pointer"
            >
              <ArrowUpDown size={12} className="text-[#838383]" />
              <span className="text-sm text-[#333]">{SORT_OPTIONS.find(o => o.value === sort)?.label}</span>
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-[#e8e8e8] shadow-md z-20 min-w-[160px]">
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
            onClick={() => setPanelOpen(true)}
            className="flex items-center gap-2 bg-[#242424] h-8 px-3 rounded cursor-pointer shrink-0 whitespace-nowrap"
          >
            <span className="text-[#d3d3d3]">Create project</span>
            <Plus size={12} className="text-[#d3d3d3]" />
          </button>
        </div>
      </Topbar>

      <div className="flex-1 overflow-y-auto p-6" onClick={() => sortOpen && setSortOpen(false)}>
        <h4 className="text-[#063530] tracking-wide mb-6">All projects</h4>
        {sorted.length === 0 ? (
          <p className="text-[#838383]">{search ? 'No projects match your search.' : 'No projects yet.'}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {sorted.map(p => {
              const stat = projectStats[p.id] ?? { total: 0, done: 0, members: [] }
              const rate = stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0
              return (
                <button
                  key={p.id}
                  onClick={() => router.push(`/projects/${p.id}`)}
                  className="bg-white shadow-[2px_4px_8px_0px_rgba(0,0,0,0.12)] p-4 flex flex-col gap-2.5 text-left hover:shadow-[2px_6px_16px_0px_rgba(0,0,0,0.16)] transition-shadow cursor-pointer"
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

      {panelOpen && <CreateProjectPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        clusters={clusters}
        members={members}
        currentUserId={currentUserId}
      />}
    </div>
  )
}
