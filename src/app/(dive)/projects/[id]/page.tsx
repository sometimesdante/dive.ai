import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import ProjectBoard from '@/ui/dive/ProjectBoard'

export const dynamic = 'force-dynamic'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient(await cookies())

  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: project },
    { data: tasks },
    { data: profile },
  ] = await Promise.all([
    supabase.from('projects').select('id, name, code').eq('id', id).single(),
    supabase.from('tasks').select('*').eq('project_id', id).order('position', { ascending: true }),
    supabase.from('profiles').select('org_id').eq('id', user!.id).single(),
  ])

  if (!project) notFound()

  const { data: members } = profile?.org_id
    ? await supabase.from('profiles').select('id, name, email').eq('org_id', profile.org_id)
    : { data: [] }

  return (
    <ProjectBoard
      project={project}
      initialTasks={tasks ?? []}
      members={members ?? []}
      currentUserId={user!.id}
    />
  )
}
