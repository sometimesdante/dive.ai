import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import ProjectSettings from '@/ui/dive/ProjectSettings'

export default async function ProjectSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient(await cookies())

  const [
    { data: project },
    { data: projectMemberRows },
    { data: orgMembers },
  ] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).single(),
    supabase.from('project_members').select('profile_id, role, profiles(id, name, email)').eq('project_id', id),
    supabase.from('profiles').select('id, name, email').not('org_id', 'is', null),
  ])

  const members = (projectMemberRows ?? []).map(row => ({
    id:    (row.profiles as any)?.id    as string,
    name:  (row.profiles as any)?.name  as string | null,
    email: (row.profiles as any)?.email as string | null,
    role:  row.role,
  })).filter(m => m.id)

  if (!project) notFound()

  return (
    <ProjectSettings
      project={project}
      members={members}
      orgMembers={orgMembers ?? []}
    />
  )
}
