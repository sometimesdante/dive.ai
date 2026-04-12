'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Copy, ArrowRight, Check } from 'lucide-react'
import Field from '@/ui/base/Field'
import { Input } from '@base-ui/react/input'
import Topbar from '@/ui/dive/Topbar'
import {
  createOrganization,
  renameOrganization,
  createCluster,
  deleteCluster,
  inviteUser,
  revokeInvite,
} from '@/app/(dive)/settings/actions'

type Profile = { id: string; org_id: string | null; role: string; name: string | null; email: string | null }
type Org     = { id: string; name: string }
type Cluster = { id: string; name: string; created_at: string }
type Member  = { id: string; name: string | null; email: string | null; role: string }
type Invite  = { id: string; email: string; token: string; created_at: string }

type Props = {
  profile: Profile | null
  org: Org | null
  clusters: Cluster[]
  members: Member[]
  invites: Invite[]
}

export default function OrgSettings({ profile, org, clusters, members, invites }: Props) {
  const router  = useRouter()
  const isAdmin = profile?.role === 'admin'

  if (!org) {
    return <CreateOrgSection onCreated={() => router.refresh()} />
  }

  return (
    <div className="flex flex-col h-full">
      <Topbar>
        <div className="flex items-center gap-3">
          <h6 className="text-[#063530]">Settings</h6>
          <span className="text-[#838383]">/</span>
          <span className="text-[#838383]">{org.name}</span>
        </div>
      </Topbar>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-4 gap-6 items-start">
          <div className="flex flex-col gap-6">
            {isAdmin && <OrgColumn org={org} onMutate={() => router.refresh()} />}
            <ClustersColumn clusters={clusters} onMutate={() => router.refresh()} />
          </div>
          <div className="flex flex-col gap-6">
            <MembersColumn members={members} />
            {isAdmin && <InvitesColumn invites={invites} onMutate={() => router.refresh()} />}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Create org ────────────────────────────────────────────────────────────────

function CreateOrgSection({ onCreated }: { onCreated: () => void }) {
  const [name, setName]       = useState('')
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const fd = new FormData()
    fd.set('name', name)
    const result = await createOrganization(fd)
    setLoading(false)
    if (result?.error) setError(result.error)
    else onCreated()
  }

  return (
    <div className="flex flex-col h-full items-center justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-[320px]">
        <div>
          <h4 className="font-semibold tracking-wide leading-tight">Create your</h4>
          <h4 className="font-semibold tracking-wide leading-tight">organisation</h4>
        </div>

        <Field label="Organisation name">
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="e.g. Zeroxa Studio"
            className="bg-white border border-black h-8 px-3 rounded text-black outline-none w-full"
          />
        </Field>

        {error && <p className="text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-between bg-[#242424] h-8 px-3 rounded text-[#d3d3d3] cursor-pointer disabled:opacity-50 w-full"
        >
          <span>{loading ? 'Creating…' : 'Create organisation'}</span>
          <ArrowRight size={12} />
        </button>
      </form>
    </div>
  )
}

// ─── Org column ────────────────────────────────────────────────────────────────

function OrgColumn({ org, onMutate }: { org: Org; onMutate: () => void }) {
  const [name, setName]       = useState(org.name)
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const fd = new FormData()
    fd.set('name', name)
    const result = await renameOrganization(fd)
    setLoading(false)
    if (result?.error) setError(result.error)
    else onMutate()
  }

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-[#063530] tracking-wide px-3">Organisation</h4>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <Field label="Name">
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="bg-white border border-black h-8 px-3 rounded text-black outline-none w-full"
          />
        </Field>
        {error && <p className="text-red-600 px-3">{error}</p>}
        <button
          type="submit"
          disabled={loading || name === org.name}
          className="flex items-center justify-between bg-[#242424] h-8 px-3 rounded text-[#d3d3d3] cursor-pointer disabled:opacity-50 w-full"
        >
          <span>{loading ? 'Saving…' : 'Save'}</span>
          <ArrowRight size={12} />
        </button>
      </form>
    </div>
  )
}

// ─── Clusters column ───────────────────────────────────────────────────────────

function ClustersColumn({ clusters, onMutate }: { clusters: Cluster[]; onMutate: () => void }) {
  const [name, setName]       = useState('')
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await createCluster(new FormData(formRef.current!))
    setLoading(false)
    if (result?.error) setError(result.error)
    else { setName(''); onMutate() }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this cluster? Projects in it will be unassigned.')) return
    const result = await deleteCluster(id)
    if (result?.error) setError(result.error)
    else onMutate()
  }

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-[#063530] tracking-wide px-3">Clusters</h4>

      <div className="flex flex-col gap-1.5">
        {clusters.length === 0
          ? <span className="text-[#838383] px-3">No clusters yet</span>
          : clusters.map(c => (
            <div key={c.id} className="flex items-center justify-between bg-white border border-[#c7c7c7] h-[34px] px-3 rounded">
              <span className="text-black">{c.name}</span>
              <button onClick={() => handleDelete(c.id)} className="text-[#838383] hover:text-[#da1e28] transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          ))
        }
      </div>

      <form ref={formRef} onSubmit={handleCreate} className="flex flex-col gap-2">
        <Field label="New cluster">
          <Input
            name="name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="e.g. Elegant Design Co."
            className="bg-white border border-black h-8 px-3 rounded text-black outline-none w-full"
          />
        </Field>
        {error && <p className="text-red-600 px-3">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-between bg-[#242424] h-8 px-3 rounded text-[#d3d3d3] cursor-pointer disabled:opacity-50 w-full"
        >
          <span>{loading ? 'Adding…' : 'Add cluster'}</span>
          <ArrowRight size={12} />
        </button>
      </form>
    </div>
  )
}

// ─── Members column ─────────────────────────────────────────────────────────────

function MembersColumn({ members }: { members: Member[] }) {
  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-[#063530] tracking-wide px-3">Members</h4>

      <div className="flex flex-col gap-1.5">
        {members.length === 0
          ? <span className="text-[#838383] px-3">No members yet</span>
          : members.map(m => (
            <div key={m.id} className="flex items-center justify-between bg-white border border-[#c7c7c7] h-[34px] px-3 rounded">
              <span className="text-black">{m.name ?? m.email}</span>
              <span className="text-[#838383] capitalize">{m.role}</span>
            </div>
          ))
        }
      </div>
    </div>
  )
}

// ─── Invites column ─────────────────────────────────────────────────────────────

function InvitesColumn({ invites, onMutate }: { invites: Invite[]; onMutate: () => void }) {
  const [email, setEmail]     = useState('')
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied]   = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await inviteUser(new FormData(formRef.current!))
    setLoading(false)
    if (result?.error) setError(result.error)
    else { setEmail(''); onMutate() }
  }

  async function handleRevoke(id: string) {
    const result = await revokeInvite(id)
    if (result?.error) setError(result.error)
    else onMutate()
  }

  function copyLink(token: string) {
    navigator.clipboard.writeText(`${window.location.origin}/auth/accept-invite?token=${token}`)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-[#063530] tracking-wide px-3">Pending invites</h4>

      <div className="flex flex-col gap-1.5">
        {invites.length === 0
          ? <span className="text-[#838383] px-3">No pending invites</span>
          : invites.map(inv => (
            <div key={inv.id} className="flex items-center justify-between bg-white border border-[#c7c7c7] h-[34px] px-3 rounded">
              <span className="text-black truncate flex-1">{inv.email}</span>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => copyLink(inv.token)} className="text-[#838383] hover:text-black transition-colors" title="Copy invite link">
                  {copied === inv.token ? <Check size={13} /> : <Copy size={13} />}
                </button>
                <button onClick={() => handleRevoke(inv.id)} className="text-[#838383] hover:text-[#da1e28] transition-colors" title="Revoke invite">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        }
      </div>

      <form ref={formRef} onSubmit={handleInvite} className="flex flex-col gap-2">
        <Field label="Invite by email">
          <Input
            name="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="colleague@example.com"
            className="bg-white border border-black h-8 px-3 rounded text-black outline-none w-full"
          />
        </Field>
        {error && <p className="text-red-600 px-3">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-between bg-[#242424] h-8 px-3 rounded text-[#d3d3d3] cursor-pointer disabled:opacity-50 w-full"
        >
          <span>{loading ? 'Sending…' : 'Send invite'}</span>
          <ArrowRight size={12} />
        </button>
      </form>
    </div>
  )
}
