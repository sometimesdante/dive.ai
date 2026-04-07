'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function createProject(formData: FormData) {
  const supabase = createClient(await cookies())

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) return { error: 'No organisation found' }

  const name          = formData.get('name') as string
  const code          = formData.get('code') as string
  const cluster_id    = (formData.get('cluster_id') as string) || null
  const owner_id      = (formData.get('owner_id') as string) || null
  const planned_start = (formData.get('planned_start') as string) || null
  const planned_end   = (formData.get('planned_end') as string) || null

  if (!name || !code) return { error: 'Name and prefix are required' }

  const { error } = await supabase.from('projects').insert({
    org_id: profile.org_id,
    name,
    code,
    cluster_id,
    owner_id,
    planned_start,
    planned_end,
  })

  if (error) return { error: error.message }

  revalidatePath('/projects')
}

export async function createTask(projectId: string, formData: FormData) {
  const supabase = createClient(await cookies())

  const name     = formData.get('name') as string
  const code     = formData.get('code') as string
  const owner_id = (formData.get('owner_id') as string) || null
  const stage  = (formData.get('stage') as string) || 'backlog'
  const status = (formData.get('status') as string) || 'on-track'

  if (!name || !code) return { error: 'Name and code are required' }

  const { data: last } = await supabase
    .from('tasks')
    .select('position')
    .eq('project_id', projectId)
    .eq('stage', stage)
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const { error } = await supabase.from('tasks').insert({
    project_id: projectId,
    name,
    code,
    owner_id,
    stage,
    status,
    position: (last?.position ?? 0) + 1,
  })

  if (error) return { error: error.message }

  revalidatePath('/projects')
}

export async function updateTaskStage(taskId: string, stage: string, position: number) {
  const supabase = createClient(await cookies())

  const { error } = await supabase
    .from('tasks')
    .update({ stage, position })
    .eq('id', taskId)

  if (error) return { error: error.message }

  revalidatePath('/projects')
}
