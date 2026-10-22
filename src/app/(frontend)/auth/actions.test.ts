import { beforeEach, describe, expect, it, vi } from 'vitest'
import { opsOf, service, supabase } from '@/test/supabase-mock'

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SITE_URL = 'https://dive.example.com'
})

vi.mock('next/headers', () => ({ cookies: vi.fn(async () => ({})) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', async () => {
  const { RedirectError } = await import('@/test/supabase-mock')
  return { redirect: vi.fn((url: string) => { throw new RedirectError(url) }) }
})
vi.mock('@/utils/supabase/server', async () => {
  const { supabase } = await import('@/test/supabase-mock')
  return { createClient: () => supabase }
})
vi.mock('@/utils/supabase/service', async () => {
  const { service } = await import('@/test/supabase-mock')
  return { createServiceClient: () => service }
})

import { acceptInvite, login, signup, signupAndAcceptInvite } from './actions'

function form(fields: Record<string, string>) {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}

const session = { access_token: 't' }

beforeEach(() => {
  supabase.reset()
  service.reset()
})

describe('login', () => {
  it('returns the auth error message', async () => {
    supabase.auth.signInWithPassword.mockResolvedValueOnce({ data: {}, error: { message: 'Invalid login credentials' } })
    await expect(login(form({ email: 'a@example.com', password: 'x' })))
      .resolves.toEqual({ error: 'Invalid login credentials' })
  })

  it('redirects to the dashboard on success', async () => {
    await expect(login(form({ email: 'a@example.com', password: 'x' })))
      .rejects.toThrow('NEXT_REDIRECT:/dashboard')
  })
})

describe('signup', () => {
  const fields = { email: 'new@example.com', password: 'secret', name: 'New User', phone: '123', address: 'Street 1' }

  it('tags the user as a Dive user and sends confirmation emails back to Dive', async () => {
    await signup(form(fields)).catch(() => {})
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'secret',
      options: {
        emailRedirectTo: 'https://dive.example.com/auth/confirm?next=/auth/onboarding',
        data: { app: 'dive', name: 'New User', phone: '123', address: 'Street 1' },
      },
    })
  })

  it('returns the auth error message', async () => {
    supabase.auth.signUp.mockResolvedValueOnce({ data: { user: null, session: null }, error: { message: 'Password too short' } })
    await expect(signup(form(fields))).resolves.toEqual({ error: 'Password too short' })
  })

  it('asks the user to check their email when confirmation is required', async () => {
    await expect(signup(form(fields)))
      .rejects.toThrow('NEXT_REDIRECT:/auth/verify-email?email=new%40example.com')
  })

  it('goes straight to onboarding when sign-up returns a session', async () => {
    supabase.auth.signUp.mockResolvedValueOnce({ data: { user: null, session }, error: null })
    await expect(signup(form(fields))).rejects.toThrow('NEXT_REDIRECT:/auth/onboarding')
  })
})

describe('signupAndAcceptInvite', () => {
  const fields = { email: 'invitee@example.com', password: 'secret', name: 'Invitee', token: 'tok-1' }

  it('sends the confirmation email back to the invite', async () => {
    await signupAndAcceptInvite(form(fields)).catch(() => {})
    const [{ options }] = supabase.auth.signUp.mock.calls[0] as [{ options: { emailRedirectTo: string; data: object } }]
    expect(options.data).toEqual({ app: 'dive', name: 'Invitee' })
    expect(options.emailRedirectTo).toBe(
      'https://dive.example.com/auth/confirm?next=%2Fauth%2Faccept-invite%3Ftoken%3Dtok-1',
    )
  })

  it('asks the user to check their email when there is no session yet', async () => {
    await expect(signupAndAcceptInvite(form(fields)))
      .rejects.toThrow('NEXT_REDIRECT:/auth/verify-email?email=invitee%40example.com')
  })
})

describe('acceptInvite', () => {
  const user   = { id: 'u1', email: 'Invitee@Example.com' }
  const invite = { id: 'i1', org_id: 'org-1', email: 'invitee@example.com', accepted_at: null }

  it('requires a signed-in user', async () => {
    await expect(acceptInvite('tok')).resolves.toEqual({ error: 'Not authenticated' })
  })

  it('rejects an unknown token', async () => {
    supabase.signedInAs(user)
    service.queue('org_invites', { data: null, error: { message: 'not found' } })
    await expect(acceptInvite('tok')).resolves.toEqual({ error: 'Invalid or expired invite' })
  })

  it('rejects an invite that was already used', async () => {
    supabase.signedInAs(user)
    service.queue('org_invites', { data: { ...invite, accepted_at: '2026-01-01' } })
    await expect(acceptInvite('tok')).resolves.toEqual({ error: 'This invite has already been used' })
  })

  it('rejects a user whose email does not match the invite', async () => {
    supabase.signedInAs({ id: 'u2', email: 'someone@example.com' })
    service.queue('org_invites', { data: invite })
    await expect(acceptInvite('tok')).resolves.toEqual({
      error: 'This invite is for invitee@example.com. You are signed in as someone@example.com.',
    })
  })

  it('refuses to move a member of another organisation', async () => {
    supabase.signedInAs(user)
    service.queue('org_invites', { data: invite })
    service.queue('profiles', { data: { org_id: 'org-other' } })
    await expect(acceptInvite('tok')).resolves.toMatchObject({ error: expect.stringContaining('another organisation') })
  })

  it('adds the user to the organisation and marks the invite accepted', async () => {
    supabase.signedInAs(user)
    service.queue('org_invites', { data: invite })
    service.queue('profiles', { data: { org_id: null } })

    await expect(acceptInvite('tok')).rejects.toThrow('NEXT_REDIRECT:/dashboard')

    const [, profileUpdate] = service.calls('profiles')
    expect(opsOf(profileUpdate, 'update')).toEqual([[{ org_id: 'org-1' }]])
    expect(opsOf(profileUpdate, 'eq')).toEqual([['id', 'u1']])

    const [, inviteUpdate] = service.calls('org_invites')
    expect(opsOf(inviteUpdate, 'update')[0][0]).toHaveProperty('accepted_at')
    expect(opsOf(inviteUpdate, 'eq')).toEqual([['id', 'i1']])
  })
})
