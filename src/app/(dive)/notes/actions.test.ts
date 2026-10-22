import { beforeEach, describe, expect, it, vi } from 'vitest'
import { opsOf, supabase } from '@/test/supabase-mock'

vi.mock('next/headers', () => ({ cookies: vi.fn(async () => ({})) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/utils/supabase/server', async () => {
  const { supabase } = await import('@/test/supabase-mock')
  return { createClient: () => supabase }
})

import { revalidatePath } from 'next/cache'
import { createNote, deleteNote, restoreNoteVersion, saveNote } from './actions'

beforeEach(() => {
  supabase.reset()
  vi.mocked(revalidatePath).mockClear()
})

describe('revalidation', () => {
  it('refreshes the all-notes page and every project notes page', async () => {
    supabase.signedInAs({ id: 'u1' })
    await saveNote('n1', 'Title', 'Body')
    expect(revalidatePath).toHaveBeenCalledWith('/notes')
    expect(revalidatePath).toHaveBeenCalledWith('/projects/[id]/notes', 'page')
  })
})

describe('createNote', () => {
  it('requires a signed-in user', async () => {
    await expect(createNote('p1')).resolves.toEqual({ error: 'Not authenticated' })
  })

  it('creates an empty note owned by the user and returns its id', async () => {
    supabase.signedInAs({ id: 'u1' })
    supabase.queue('notes', { data: { id: 'n1' } })
    await expect(createNote('p1')).resolves.toEqual({ id: 'n1' })
    expect(opsOf(supabase.calls('notes')[0], 'insert')).toEqual([[
      { project_id: 'p1', owner_id: 'u1', title: 'Untitled', content: '' },
    ]])
  })
})

describe('saveNote', () => {
  beforeEach(() => supabase.signedInAs({ id: 'u1' }))

  it('only updates notes the user owns', async () => {
    await saveNote('n1', 'Title', 'Body')
    const [update] = supabase.calls('notes')
    expect(opsOf(update, 'update')[0][0]).toMatchObject({ title: 'Title', content: 'Body' })
    expect(opsOf(update, 'eq')).toEqual([['id', 'n1'], ['owner_id', 'u1']])
  })

  it('does not snapshot by default', async () => {
    await saveNote('n1', 'Title', 'Body')
    expect(supabase.calls('note_versions')).toHaveLength(0)
  })

  it('stores a version when asked to snapshot', async () => {
    await saveNote('n1', 'Title', 'Body', true)
    expect(opsOf(supabase.calls('note_versions')[0], 'insert')).toEqual([[
      { note_id: 'n1', title: 'Title', content: 'Body' },
    ]])
  })

  it('reports a failed snapshot', async () => {
    supabase.queue('note_versions', { error: { message: 'insert denied' } })
    await expect(saveNote('n1', 'Title', 'Body', true)).resolves.toEqual({ error: 'insert denied' })
  })

  it('does not snapshot when the save fails', async () => {
    supabase.queue('notes', { error: { message: 'boom' } })
    await expect(saveNote('n1', 'Title', 'Body', true)).resolves.toEqual({ error: 'boom' })
    expect(supabase.calls('note_versions')).toHaveLength(0)
  })
})

describe('deleteNote', () => {
  it('only deletes notes the user owns', async () => {
    supabase.signedInAs({ id: 'u1' })
    await deleteNote('n1')
    expect(opsOf(supabase.calls('notes')[0], 'eq')).toEqual([['id', 'n1'], ['owner_id', 'u1']])
  })
})

describe('restoreNoteVersion', () => {
  beforeEach(() => supabase.signedInAs({ id: 'u1' }))

  it('copies the version back into the note', async () => {
    supabase.queue('note_versions', { data: { title: 'Old', content: 'Old body' } })
    await expect(restoreNoteVersion('n1', 'v1')).resolves.toEqual({ title: 'Old', content: 'Old body' })
    expect(opsOf(supabase.calls('notes')[0], 'update')[0][0]).toMatchObject({ title: 'Old', content: 'Old body' })
  })

  it('reports a missing version', async () => {
    supabase.queue('note_versions', { data: null, error: { message: 'no rows' } })
    await expect(restoreNoteVersion('n1', 'v1')).resolves.toEqual({ error: 'Version not found' })
    expect(supabase.calls('notes')).toHaveLength(0)
  })

  // Known bug: the version is looked up by id alone, so a version of another
  // note the user owns can be restored into this one.
  it.fails('only restores versions that belong to the note', async () => {
    supabase.queue('note_versions', { data: { title: 'Old', content: 'Old body' } })
    await restoreNoteVersion('n1', 'v1')
    expect(opsOf(supabase.calls('note_versions')[0], 'eq')).toContainEqual(['note_id', 'n1'])
  })
})
