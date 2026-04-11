'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'
import Toggle from '@/ui/base/Toggle'
import Field from '@/ui/base/Field'
import Dropdown from '@/ui/base/Dropdown'
import Topbar from '@/ui/dive/Topbar'
import {
  updateProjectSettings,
  archiveProject,
  deleteProject,
} from '@/app/(dive)/projects/[id]/settings/actions'

type Project = {
  id: string
  name: string
  code: string
  description: string | null
  owner_id: string | null
  planned_start: string | null
  planned_end: string | null
  sprint_cadence: string | null
  timezone: string | null
  is_public: boolean
  pages_enabled: boolean
  tickets_enabled: boolean
  time_tracking_enabled: boolean
  cost_center_code: string | null
  is_archived: boolean
}

type Member = { id: string; name: string | null; email: string | null }
type OrgMember = { id: string; name: string | null; email: string | null }

type Props = {
  project: Project
  members: Member[]
  orgMembers: OrgMember[]
}

const SPRINT_OPTIONS = ['weekly', 'bi-weekly', 'monthly']

const TIMEZONES = [
  'UTC', 'UTC-5 (Eastern Time)', 'UTC-6 (Central Time)',
  'UTC-7 (Mountain Time)', 'UTC-8 (Pacific Time)',
  'UTC+0 (GMT)', 'UTC+1 (CET)', 'UTC+5:30 (IST)', 'UTC+8 (SGT)', 'UTC+9 (JST)',
]


export default function ProjectSettings({ project, members, orgMembers }: Props) {
  const router = useRouter()

  const [code, setCode]                   = useState(project.code)
  const [description, setDescription]     = useState(project.description ?? '')
  const [plannedStart, setPlannedStart]   = useState(project.planned_start ?? '')
  const [plannedEnd, setPlannedEnd]       = useState(project.planned_end ?? '')
  const [sprintCadence, setSprintCadence] = useState(project.sprint_cadence ?? 'bi-weekly')
  const [timezone, setTimezone]           = useState(project.timezone ?? 'UTC')
  const [ownerId, setOwnerId]             = useState(project.owner_id ?? '')

  const [isPublic, setIsPublic]                       = useState(project.is_public)
  const [pagesEnabled, setPagesEnabled]               = useState(project.pages_enabled)
  const [ticketsEnabled, setTicketsEnabled]           = useState(project.tickets_enabled)
  const [timeTrackingEnabled, setTimeTrackingEnabled] = useState(project.time_tracking_enabled)

  const [costCenterCode, setCostCenterCode] = useState(project.cost_center_code ?? '')

  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(false)
    const fd = new FormData()
    fd.set('code', code)
    fd.set('description', description)
    fd.set('planned_start', plannedStart)
    fd.set('planned_end', plannedEnd)
    fd.set('sprint_cadence', sprintCadence)
    fd.set('timezone', timezone)
    fd.set('owner_id', ownerId)
    fd.set('is_public', String(isPublic))
    fd.set('pages_enabled', String(pagesEnabled))
    fd.set('tickets_enabled', String(ticketsEnabled))
    fd.set('time_tracking_enabled', String(timeTrackingEnabled))
    fd.set('cost_center_code', costCenterCode)
    const result = await updateProjectSettings(project.id, fd)
    setSaving(false)
    if (result?.error) setError(result.error)
    else setSuccess(true)
  }

  async function handleArchive() {
    if (!confirm('Archive this project?')) return
    await archiveProject(project.id)
  }

  async function handleDelete() {
    if (!confirm('Permanently delete this project? This cannot be undone.')) return
    await deleteProject(project.id)
  }

  return (
    <div className="flex flex-col h-full">
      <Topbar>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/projects')}
            className="text-[#838383] hover:text-black transition-colors"
          >
            ← Projects
          </button>
          <span className="text-[#838383]">/</span>
          <h6 className="text-[#063530]">{project.name}</h6>
        </div>
        <div className="flex items-center gap-2">
          {error && <span className="text-red-600">{error}</span>}
          {success && <span className="text-[#14b8a6]">Saved</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#242424] h-8 px-4 rounded text-[#d3d3d3] cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </Topbar>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-4 gap-6 items-start">

          {/* ── Column 1: Project details ── */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[#063530] tracking-wide px-3">Project details</h4>

            <Field label="Prefix*">
              <input
                value={code}
                onChange={e => setCode(e.target.value)}
                className="bg-white border border-black h-8 px-3 rounded text-black outline-none w-full"
              />
            </Field>

            <Field label="Description">
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                className="bg-white border border-black px-3 py-2 rounded text-black outline-none w-full resize-none"
              />
            </Field>

            <div className="flex gap-3">
              <Field label="Planned start" className="flex-1">
                <input
                  type="date"
                  value={plannedStart}
                  onChange={e => setPlannedStart(e.target.value)}
                  className="bg-white border border-[#c7c7c7] h-8 px-3 rounded text-black outline-none w-full"
                />
              </Field>
              <Field label="Planned end" className="flex-1">
                <input
                  type="date"
                  value={plannedEnd}
                  onChange={e => setPlannedEnd(e.target.value)}
                  className="bg-white border border-[#c7c7c7] h-8 px-3 rounded text-black outline-none w-full"
                />
              </Field>
            </div>

            <Field label="Sprint Cadence">
              <Dropdown
                value={sprintCadence}
                onChange={e => setSprintCadence(e.target.value)}
                options={SPRINT_OPTIONS.map(o => ({ label: o, value: o }))}
              />
            </Field>

            <Field label="Timezone">
              <Dropdown
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                options={TIMEZONES.map(o => ({ label: o, value: o }))}
              />
            </Field>
          </div>

          {/* ── Column 2: Members ── */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[#063530] tracking-wide px-3">Members</h4>

            <Field label="Project owner">
              <Dropdown
                value={ownerId}
                onChange={e => setOwnerId(e.target.value)}
                options={[
                  { label: '— none —', value: '' },
                  ...orgMembers.map(m => ({ label: m.name ?? m.email ?? '', value: m.id })),
                ]}
              />
            </Field>

            <div className="flex flex-col gap-1.5">
              <span className="text-[#838383] px-3">Project members</span>
              <div className="flex flex-col gap-1.5">
                {members.length === 0
                  ? <span className="text-[#838383] px-3">No members assigned yet</span>
                  : members.map(m => (
                    <div
                      key={m.id}
                      className="flex items-center gap-1.5 bg-white border border-black h-[26px] px-3 rounded-full w-fit"
                    >
                      <span className="text-black">{m.name ?? m.email}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>

          {/* ── Column 3: Permissions + Integrations ── */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h4 className="text-[#063530] tracking-wide px-3">Manage permissions</h4>
              <Toggle label="Public visibility"          checked={isPublic}            onChange={setIsPublic} />
              <Toggle label="Pages enabled"              checked={pagesEnabled}         onChange={setPagesEnabled} />
              <Toggle label="Ticket management enabled"  checked={ticketsEnabled}       onChange={setTicketsEnabled} />
              <Toggle label="Time tracking enabled"      checked={timeTrackingEnabled}  onChange={setTimeTrackingEnabled} />
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-[#063530] tracking-wide px-3">Integrations</h4>
              {(['Stripe', 'Zapier', 'GitHub'] as const).map(brand => (
                <button
                  key={brand}
                  className="flex items-center justify-between bg-white border border-black h-[26px] px-3 rounded-full w-full cursor-pointer hover:bg-[#f2f2f2] transition-colors"
                >
                  <span className="text-black">{brand}</span>
                  <ArrowUpRight size={12} />
                </button>
              ))}
            </div>
          </div>

          {/* ── Column 4: Admin ── */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[#063530] tracking-wide px-3">Admin</h4>

            <Field label="Cost Center Code">
              <input
                value={costCenterCode}
                onChange={e => setCostCenterCode(e.target.value)}
                placeholder="e.g. ENG-DB-2024"
                className="bg-white border border-[#c7c7c7] h-8 px-3 rounded text-black outline-none w-full"
              />
            </Field>

            <button
              onClick={handleArchive}
              className="bg-[#242424] h-8 px-3 rounded text-[#d3d3d3] cursor-pointer w-full"
            >
              Archive project
            </button>

            <button
              onClick={handleDelete}
              className="bg-[#da1e28] h-8 px-3 rounded text-[#f2f2f2] cursor-pointer w-full"
            >
              Delete project
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

