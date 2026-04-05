import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import ProjectSettings from '@/ui/dive/ProjectSettings'

export default async function ProjectSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient(await cookies())

  const [
    { data: project },
    { data: taskAssignees },
    { data: orgMembers },
  ] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).single(),
    supabase.from('tasks').select('owner_id, profiles!owner_id(id, name, email)').eq('project_id', id).not('owner_id', 'is', null),
    supabase.from('profiles').select('id, name, email').not('org_id', 'is', null),
  ])

  // Deduplicate by profile id
  const seen = new Set<string>()
  const members = (taskAssignees ?? []).reduce<{ id: string; name: string | null; email: string | null }[]>((acc, t) => {
    const p = t.profiles as unknown as { id: string; name: string | null; email: string | null } | null
    if (p && !seen.has(p.id)) { seen.add(p.id); acc.push(p) }
    return acc
  }, [])

  if (!project) notFound()

  return (
    <ProjectSettings
      project={project}
      members={members ?? []}
      orgMembers={orgMembers ?? []}
    />
  )
}
