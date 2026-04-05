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

  const [{ data: projects }, { data: members }, { data: clusters }] = await Promise.all([
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

  return (
    <ProjectsBoard
      projects={projects ?? []}
      members={members ?? []}
      clusters={clusters ?? []}
      currentUserId={user!.id}
    />
  )
}
