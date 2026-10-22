import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import ProjectsBoard from '@/ui/dive/ProjectsBoard'
import { buildProjectStats } from '@/utils/projects'

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
      ? supabase.from('projects').select('id, name, code, planned_end').eq('org_id', orgId).eq('is_archived', false).order('name')
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

  const projectStats = buildProjectStats(projects ?? [], allTasks ?? [], projectMembersData ?? [])

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
