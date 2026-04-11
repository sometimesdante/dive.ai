'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'

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

  const { data: project, error } = await supabase.from('projects').insert({
    org_id: profile.org_id,
    name,
    code,
    cluster_id,
    owner_id,
    planned_start,
    planned_end,
  }).select('id').single()

  if (error) return { error: error.message }

  const service = createServiceClient()
  await service.from('project_members').insert({ project_id: project.id, profile_id: user.id, role: 'owner' })

  revalidatePath('/projects', 'layout')
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

  revalidatePath('/projects', 'layout')
}

export async function updateTask(taskId: string, formData: FormData) {
  const supabase = createClient(await cookies())

  const name     = formData.get('name') as string
  const owner_id = (formData.get('owner_id') as string) || null
  const status   = formData.get('status') as string

  if (!name) return { error: 'Name is required' }

  const { error } = await supabase
    .from('tasks')
    .update({ name, owner_id, status })
    .eq('id', taskId)

  if (error) return { error: error.message }

  revalidatePath('/projects', 'layout')
}

export async function deleteTask(taskId: string) {
  const supabase = createClient(await cookies())

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) return { error: error.message }

  revalidatePath('/projects', 'layout')
}

export async function updateTaskStage(taskId: string, stage: string, position: number) {
  const supabase = createClient(await cookies())

  const { error } = await supabase
    .from('tasks')
    .update({ stage, position, status: stage === 'done' ? 'complete' : stage === 'doing' ? 'on-track' : 'default' })
    .eq('id', taskId)

  if (error) return { error: error.message }

  revalidatePath('/projects', 'layout')
}
