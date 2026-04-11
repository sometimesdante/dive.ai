'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Topbar from '@/ui/dive/Topbar'

const CreateProjectPanel = dynamic(() => import('@/ui/dive/CreateProjectPanel'))

type Project  = { id: string; name: string; code: string }
type Member   = { id: string; name: string | null; email: string | null }
type Cluster  = { id: string; name: string }
type ProjectStat = { total: number; done: number; members: Member[] }

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

  return (
    <div className="flex flex-col h-full">
      <Topbar>
        <div />
        <button
          onClick={() => setPanelOpen(true)}
          className="flex items-center gap-2 bg-[#242424] h-8 px-3 rounded cursor-pointer shrink-0 whitespace-nowrap"
        >
          <span className="text-[#d3d3d3]">Create project</span>
          <Plus size={12} className="text-[#d3d3d3]" />
        </button>
      </Topbar>

      <div className="flex-1 overflow-y-auto p-6">
        <h4 className="text-[#063530] tracking-wide mb-6">All projects</h4>
        {projects.length === 0 ? (
          <p className="text-[#838383]">No projects yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {projects.map(p => {
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
