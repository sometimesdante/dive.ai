'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function updateProjectSettings(projectId: string, formData: FormData) {
  const supabase = createClient(await cookies())

  const { error } = await supabase
    .from('projects')
    .update({
      code:                    formData.get('code'),
      description:             formData.get('description'),
      planned_start:           formData.get('planned_start') || null,
      planned_end:             formData.get('planned_end') || null,
      sprint_cadence:          formData.get('sprint_cadence'),
      timezone:                formData.get('timezone'),
      owner_id:                formData.get('owner_id') || null,
      is_public:               formData.get('is_public') === 'true',
      pages_enabled:           formData.get('pages_enabled') === 'true',
      tickets_enabled:         formData.get('tickets_enabled') === 'true',
      time_tracking_enabled:   formData.get('time_tracking_enabled') === 'true',
      cost_center_code:        formData.get('cost_center_code') || null,
    })
    .eq('id', projectId)

  if (error) return { error: error.message }

  revalidatePath(`/projects/${projectId}/settings`)
  revalidatePath('/projects')
}

export async function archiveProject(projectId: string) {
  const supabase = createClient(await cookies())

  const { error } = await supabase
    .from('projects')
    .update({ is_archived: true })
    .eq('id', projectId)

  if (error) return { error: error.message }

  revalidatePath('/projects')
  redirect('/projects')
}

export async function deleteProject(projectId: string) {
  const supabase = createClient(await cookies())

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (error) return { error: error.message }

  revalidatePath('/projects')
  redirect('/projects')
}

export async function addProjectMember(projectId: string, profileId: string, role: string) {
  const supabase = createClient(await cookies())

  const { error } = await supabase
    .from('project_members')
    .upsert({ project_id: projectId, profile_id: profileId, role })

  if (error) return { error: error.message }

  revalidatePath(`/projects/${projectId}/settings`)
}

export async function removeProjectMember(projectId: string, profileId: string) {
  const supabase = createClient(await cookies())

  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('profile_id', profileId)

  if (error) return { error: error.message }

  revalidatePath(`/projects/${projectId}/settings`)
}
