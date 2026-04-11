import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import ProjectsBoard from '@/ui/dive/ProjectsBoard'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const supabase = createClient(await cookies())

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user!.id)
    .single()

  const orgId = profile?.org_id

  const [
    { data: projects },
    { data: members },
    { data: clusters },
  ] = await Promise.all([
    orgId
      ? supabase.from('projects').select('id, name, code').eq('org_id', orgId).eq('is_archived', false).order('name')
      : Promise.resolve({ data: [] }),
    orgId
      ? supabase.from('profiles').select('id, name, email').eq('org_id', orgId)
      : Promise.resolve({ data: [] }),
    orgId
      ? supabase.from('clusters').select('id, name').eq('org_id', orgId).order('name')
      : Promise.resolve({ data: [] }),
  ])

  const projectIds = (projects ?? []).map(p => p.id)

  const [
    { data: allTasks },
    { data: projectMembersData },
  ] = await Promise.all([
    projectIds.length
      ? supabase.from('tasks').select('id, project_id, stage').in('project_id', projectIds)
      : Promise.resolve({ data: [] }),
    projectIds.length
      ? supabase.from('project_members').select('project_id, profile_id, profiles(id, name, email)').in('project_id', projectIds)
      : Promise.resolve({ data: [] }),
  ])

  // Build per-project stats
  const projectStats: Record<string, { total: number; done: number; members: { id: string; name: string | null; email: string | null }[] }> = {}

  for (const p of projects ?? []) {
    projectStats[p.id] = { total: 0, done: 0, members: [] }
  }
  for (const t of allTasks ?? []) {
    if (projectStats[t.project_id]) {
      projectStats[t.project_id].total++
      if (t.stage === 'done') projectStats[t.project_id].done++
    }
  }
  for (const pm of projectMembersData ?? []) {
    const profile = (pm as any).profiles
    if (projectStats[pm.project_id] && profile) {
      projectStats[pm.project_id].members.push(profile)
    }
  }

  return (
    <ProjectsBoard
      projects={projects ?? []}
      members={members ?? []}
      clusters={clusters ?? []}
      currentUserId={user!.id}
      projectStats={projectStats}
    />
  )
}
