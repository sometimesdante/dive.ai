import { beforeEach, describe, expect, it, vi } from 'vitest'
import { opsOf, supabase } from '@/test/supabase-mock'

vi.mock('next/headers', () => ({ cookies: vi.fn(async () => ({})) }))
vi.mock('@/utils/supabase/server', async () => {
  const { supabase } = await import('@/test/supabase-mock')
  return { createClient: () => supabase }
})

import { sendMessage } from './actions'

beforeEach(() => supabase.reset())

describe('sendMessage', () => {
  it('requires a signed-in user', async () => {
    await expect(sendMessage('p1', 'hi')).resolves.toEqual({ error: 'Not authenticated' })
    expect(supabase.calls('messages')).toHaveLength(0)
  })

  it('inserts a text message from the current user', async () => {
    supabase.signedInAs({ id: 'u1' })
    await expect(sendMessage('p1', 'hello')).resolves.toBeUndefined()
    expect(opsOf(supabase.calls('messages')[0], 'insert')).toEqual([[{
      project_id: 'p1',
      sender_id: 'u1',
      content: 'hello',
      attachment_url: null,
      attachment_name: null,
      attachment_type: null,
      attachment_size: null,
    }]])
  })

  it('stores attachment metadata', async () => {
    supabase.signedInAs({ id: 'u1' })
    await sendMessage('p1', '', { url: 'https://x/a.png', name: 'a.png', type: 'image/png', size: 42 })
    expect(opsOf(supabase.calls('messages')[0], 'insert')[0][0]).toMatchObject({
      attachment_url: 'https://x/a.png',
      attachment_name: 'a.png',
      attachment_type: 'image/png',
      attachment_size: 42,
    })
  })

  it('returns the database error message', async () => {
    supabase.signedInAs({ id: 'u1' })
    supabase.queue('messages', { error: { message: 'new row violates row-level security policy' } })
    await expect(sendMessage('p1', 'hi')).resolves.toEqual({ error: 'new row violates row-level security policy' })
  })
})
