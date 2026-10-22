import { beforeEach, describe, expect, it, vi } from 'vitest'
import { opsOf, service, supabase } from '@/test/supabase-mock'

vi.mock('next/headers', () => ({ cookies: vi.fn(async () => ({})) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/utils/supabase/server', async () => {
  const { supabase } = await import('@/test/supabase-mock')
  return { createClient: () => supabase }
})
vi.mock('@/utils/supabase/service', async () => {
  const { service } = await import('@/test/supabase-mock')
  return { createServiceClient: () => service }
})

import { createProject, createTask, updateTaskStage } from './actions'

function form(fields: Record<string, string>) {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}

beforeEach(() => {
  supabase.reset()
  service.reset()
})

describe('createProject', () => {
  it('requires a signed-in user', async () => {
    await expect(createProject(form({ name: 'P', code: 'P-001' }))).resolves.toEqual({ error: 'Not authenticated' })
  })

  it('requires an organisation', async () => {
    supabase.signedInAs({ id: 'u1' })
    supabase.queue('profiles', { data: { org_id: null } })
    await expect(createProject(form({ name: 'P', code: 'P-001' }))).resolves.toEqual({ error: 'No organisation found' })
  })

  it('requires a name and prefix', async () => {
    supabase.signedInAs({ id: 'u1' })
    supabase.queue('profiles', { data: { org_id: 'org-1' } })
    await expect(createProject(form({ name: 'P' }))).resolves.toEqual({ error: 'Name and prefix are required' })
  })

  it('creates the project in the user\'s org and makes them its owner', async () => {
    supabase.signedInAs({ id: 'u1' })
    supabase.queue('profiles', { data: { org_id: 'org-1' } })
    supabase.queue('projects', { data: { id: 'p1' } })

    await expect(createProject(form({ name: 'Brand refresh', code: 'BR-001', cluster_id: '' }))).resolves.toBeUndefined()

    expect(opsOf(supabase.calls('projects')[0], 'insert')[0][0]).toEqual({
      org_id: 'org-1',
      name: 'Brand refresh',
      code: 'BR-001',
      cluster_id: null,
      owner_id: null,
      planned_start: null,
      planned_end: null,
    })
    expect(opsOf(service.calls('project_members')[0], 'insert')).toEqual([[
      { project_id: 'p1', profile_id: 'u1', role: 'owner' },
    ]])
  })
})

describe('createTask', () => {
  it('requires a name and code', async () => {
    await expect(createTask('p1', form({ name: 'T' }))).resolves.toEqual({ error: 'Name and code are required' })
  })

  it('puts the task below the last one in its stage', async () => {
    supabase.queue('tasks', { data: { position: 4.5 } })
    await createTask('p1', form({ name: 'T', code: 'P-T001', stage: 'todo' }))

    const [lookup, insert] = supabase.calls('tasks')
    expect(opsOf(lookup, 'eq')).toEqual([['project_id', 'p1'], ['stage', 'todo']])
    expect(opsOf(insert, 'insert')[0][0]).toMatchObject({ stage: 'todo', position: 5.5 })
  })

  it('starts an empty stage at position 1 with backlog / on-track defaults', async () => {
    await createTask('p1', form({ name: 'T', code: 'P-T001' }))
    const [, insert] = supabase.calls('tasks')
    expect(opsOf(insert, 'insert')[0][0]).toMatchObject({
      stage: 'backlog',
      status: 'on-track',
      owner_id: null,
      position: 1,
    })
  })
})

describe('updateTaskStage', () => {
  it.each([
    ['done',    'complete'],
    ['doing',   'on-track'],
    ['todo',    'default'],
  ])('moving to %s sets status %s', async (stage, status) => {
    await updateTaskStage('t1', stage, 2)
    const [call] = supabase.calls('tasks')
    expect(opsOf(call, 'update')).toEqual([[{ stage, position: 2, status }]])
    expect(opsOf(call, 'eq')).toEqual([['id', 't1']])
  })
})
