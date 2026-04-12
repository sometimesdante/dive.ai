'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function createNote(projectId: string) {
  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('notes')
    .insert({ project_id: projectId, owner_id: user.id, title: 'Untitled', content: '' })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/notes')
  return { id: data.id }
}

export async function saveNote(
  noteId: string,
  title: string,
  content: string,
  snapshot: boolean = false,
) {
  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('notes')
    .update({ title, content, updated_at: new Date().toISOString() })
    .eq('id', noteId)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }

  if (snapshot) {
    await supabase.from('note_versions').insert({ note_id: noteId, title, content })
  }

  revalidatePath('/notes')
  return {}
}

export async function deleteNote(noteId: string) {
  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/notes')
  return {}
}

export async function getNoteVersions(noteId: string) {
  const supabase = createClient(await cookies())
  const { data, error } = await supabase
    .from('note_versions')
    .select('id, title, created_at')
    .eq('note_id', noteId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return { error: error.message, versions: [] }
  return { versions: data ?? [] }
}

export async function restoreNoteVersion(noteId: string, versionId: string) {
  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: version, error: vErr } = await supabase
    .from('note_versions')
    .select('title, content')
    .eq('id', versionId)
    .single()

  if (vErr || !version) return { error: 'Version not found' }

  const { error } = await supabase
    .from('notes')
    .update({ title: version.title, content: version.content, updated_at: new Date().toISOString() })
    .eq('id', noteId)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/notes')
  return { title: version.title, content: version.content }
}
