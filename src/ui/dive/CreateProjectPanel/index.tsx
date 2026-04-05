'use client'

import { useRef, useState } from 'react'
import { ArrowRight, X } from 'lucide-react'
import { createProject } from '@/app/(dive)/projects/actions'

type Member  = { id: string; name: string | null; email: string | null }
type Cluster = { id: string; name: string }

type Props = {
  open: boolean
  onClose: () => void
  clusters: Cluster[]
  members: Member[]
  currentUserId: string
}

function generatePrefix(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .join('')
  const num = Math.floor(100 + Math.random() * 900)
  return `${initials}-${num}`
}

export default function CreateProjectPanel({ open, onClose, clusters, members, currentUserId }: Props) {
  const [error, setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [prefix, setPrefix] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await createProject(new FormData(formRef.current!))
    setLoading(false)
    if (result?.error) {
      setError(result.error)
    } else {
      formRef.current?.reset()
      setPrefix('')
      onClose()
    }
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 backdrop-blur-[2px] bg-white/20 z-30"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[320px] bg-[#f2f2f2] border-l border-[#e8e8e8] shadow-xl flex flex-col gap-4 p-6 z-40 transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-wide leading-tight">New project?</h2>
            <h2 className="text-2xl font-semibold tracking-wide leading-tight">New beginnings</h2>
          </div>
          <button onClick={onClose} className="mt-1 p-1 hover:bg-black/10 rounded">
            <X size={14} />
          </button>
        </div>

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3 flex-1 overflow-y-auto">

          {/* Cluster */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] text-[#838383] px-3">Cluster</span>
            <div className="relative">
              <select
                name="cluster_id"
                className="bg-white border border-[#c7c7c7] h-8 px-3 rounded text-base text-black outline-none appearance-none cursor-pointer w-full"
              >
                <option value="">— none —</option>
                {clusters.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="10" height="5" viewBox="0 0 10 5" fill="none">
                <path d="M0 0L5 5L10 0H0Z" fill="#242424" />
              </svg>
            </div>
          </div>

          {/* Project Name */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] text-[#838383] px-3">Project Name</span>
            <input
              name="name"
              required
              placeholder="e.g. Database Migration Tool"
              onBlur={e => { if (e.target.value && !prefix) setPrefix(generatePrefix(e.target.value)) }}
              className="bg-white border border-black h-8 px-3 rounded text-base text-black outline-none w-full"
            />
          </div>

          {/* Prefix */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] text-[#838383] px-3">Prefix*</span>
            <input
              name="code"
              required
              value={prefix}
              onChange={e => setPrefix(e.target.value)}
              placeholder="e.g. DMT-"
              className="bg-white border border-black h-8 px-3 rounded text-base text-black outline-none w-full"
            />
          </div>

          {/* Project owner */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] text-[#838383] px-3">Select the project owner</span>
            <div className="relative">
              <select
                name="owner_id"
                defaultValue={currentUserId}
                className="bg-white border border-[#c7c7c7] h-8 px-3 rounded text-base text-black outline-none appearance-none cursor-pointer w-full"
              >
                <option value="">—</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name ?? m.email ?? m.id}
                  </option>
                ))}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="10" height="5" viewBox="0 0 10 5" fill="none">
                <path d="M0 0L5 5L10 0H0Z" fill="#242424" />
              </svg>
            </div>
          </div>

          {/* Dates */}
          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <span className="text-[13px] text-[#838383] px-3">Planned start</span>
              <input
                name="planned_start"
                type="date"
                className="bg-white border border-[#c7c7c7] h-8 px-3 rounded text-[13px] text-black outline-none w-full"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <span className="text-[13px] text-[#838383] px-3">Planned end</span>
              <input
                name="planned_end"
                type="date"
                className="bg-white border border-[#c7c7c7] h-8 px-3 rounded text-[13px] text-black outline-none w-full"
              />
            </div>
          </div>

          {error && <p className="text-red-600 text-[13px] px-1">{error}</p>}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-auto flex items-center justify-between bg-[#242424] h-8 px-3 rounded text-[#d3d3d3] text-base cursor-pointer disabled:opacity-50 w-full"
          >
            <span>{loading ? 'Creating…' : 'Create'}</span>
            <ArrowRight size={12} />
          </button>
        </form>
      </div>
    </>
  )
}
