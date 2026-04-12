import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import NotesEditor from '@/ui/dive/Notes'

export const dynamic = 'force-dynamic'

export default async function NotesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient(await cookies())

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, code')
    .eq('id', id)
    .single()

  if (!project) notFound()

  const { data: notes } = await supabase
    .from('notes')
    .select('id, title, content, updated_at')
    .eq('project_id', id)
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false })

  return (
    <NotesEditor
      project={project}
      initialNotes={notes ?? []}
      currentUserId={user.id}
    />
  )
}
