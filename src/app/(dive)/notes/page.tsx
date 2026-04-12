import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import AllNotesEditor from '@/ui/dive/Notes/AllNotesEditor'

export const dynamic = 'force-dynamic'

export default async function NotesPage() {
  const supabase = createClient(await cookies())

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  const orgId = profile?.org_id

  const [{ data: notesRaw }, { data: projects }] = await Promise.all([
    supabase
      .from('notes')
      .select('id, title, content, updated_at, project_id, projects(name)')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false }),
    orgId
      ? supabase.from('projects').select('id, name, code').eq('org_id', orgId).eq('is_archived', false).order('name')
      : Promise.resolve({ data: [] }),
  ])

  const notes = (notesRaw ?? []).map(n => ({
    id: n.id,
    title: n.title,
    content: n.content,
    updated_at: n.updated_at,
    project_id: n.project_id,
    project_name: (Array.isArray(n.projects) ? n.projects[0] : n.projects as { name: string } | null)?.name ?? '',
  }))

  return (
    <AllNotesEditor
      initialNotes={notes}
      projects={projects ?? []}
    />
  )
}
