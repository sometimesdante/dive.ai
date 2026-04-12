'use client'

import { useRef, useState } from 'react'
import { ArrowRight, X } from 'lucide-react'
import Field from '@/ui/base/Field'
import { Input } from '@base-ui/react/input'
import Dropdown from '@/ui/base/Dropdown'
import SlidePanel from '@/ui/base/SlidePanel'
import { createProject } from '@/app/(dive)/projects/actions'
import { createClient } from '@/utils/supabase/client'

type Member  = { id: string; name: string | null; email: string | null }
type Cluster = { id: string; name: string }

type Props = {
  open: boolean
  onClose: () => void
  clusters: Cluster[]
  members: Member[]
  currentUserId: string
}

async function generatePrefix(name: string): Promise<string> {
  const initials = name.split(/\s+/).filter(Boolean).map(w => w[0].toUpperCase()).join('')
  const supabase = createClient()
  const { data } = await supabase
    .from('projects')
    .select('code')
    .ilike('code', `${initials}-%`)
  const nums = (data ?? [])
    .map(p => parseInt(p.code.slice(initials.length + 1), 10))
    .filter(n => !isNaN(n))
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1
  return `${initials}-${String(next).padStart(3, '0')}`
}

export default function CreateProjectPanel({ open, onClose, clusters, members, currentUserId }: Props) {
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [prefix, setPrefix]   = useState('')
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
    <SlidePanel open={open} onClose={onClose} width={360}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold tracking-wide leading-tight">New project?</h3>
          <h3 className="font-semibold tracking-wide leading-tight">New beginnings</h3>
        </div>
        <button onClick={onClose} className="mt-1 p-1 hover:bg-black/10 rounded">
          <X size={14} />
        </button>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3 flex-1 overflow-y-auto">

        <Field label="Cluster">
          <Dropdown
            name="cluster_id"
            options={[
              { label: '— none —', value: '' },
              ...clusters.map(c => ({ label: c.name, value: c.id })),
            ]}
          />
        </Field>

        <Field label="Project Name">
          <Input
            name="name"
            required
            placeholder="e.g. Database Migration Tool"
            onBlur={async e => { if (e.target.value && !prefix) setPrefix(await generatePrefix(e.target.value)) }}
            className="bg-white border border-black h-8 px-3 rounded text-black outline-none w-full"
          />
        </Field>

        <Field label="Prefix*">
          <Input
            name="code"
            required
            value={prefix}
            onChange={e => setPrefix(e.target.value)}
            placeholder="e.g. DMT-"
            className="bg-white border border-black h-8 px-3 rounded text-black outline-none w-full"
          />
        </Field>

        <Field label="Select the project owner">
          <Dropdown
            name="owner_id"
            defaultValue={currentUserId}
            options={[
              { label: '—', value: '' },
              ...members.map(m => ({ label: m.name ?? m.email ?? m.id, value: m.id })),
            ]}
          />
        </Field>

        <div className="flex gap-3">
          <Field label="Planned start" className="flex-1">
            <Input
              name="planned_start"
              type="date"
              className="bg-white border border-[#c7c7c7] h-8 px-3 rounded text-black outline-none w-full"
            />
          </Field>
          <Field label="Planned end" className="flex-1">
            <Input
              name="planned_end"
              type="date"
              className="bg-white border border-[#c7c7c7] h-8 px-3 rounded text-black outline-none w-full"
            />
          </Field>
        </div>

        {error && <p className="text-red-600 px-1">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-auto flex items-center justify-between bg-[#242424] h-8 px-3 rounded text-[#d3d3d3] cursor-pointer disabled:opacity-50 w-full"
        >
          <span>{loading ? 'Creating…' : 'Create'}</span>
          <ArrowRight size={12} />
        </button>
      </form>
    </SlidePanel>
  )
}
