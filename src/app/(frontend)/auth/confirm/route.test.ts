import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { supabase } from '@/test/supabase-mock'

vi.mock('next/headers', () => ({ cookies: vi.fn(async () => ({})) }))
vi.mock('next/navigation', async () => {
  const { RedirectError } = await import('@/test/supabase-mock')
  return { redirect: vi.fn((url: string) => { throw new RedirectError(url) }) }
})
vi.mock('@/utils/supabase/server', async () => {
  const { supabase } = await import('@/test/supabase-mock')
  return { createClient: () => supabase }
})

import { GET } from './route'

const request = (query: string) => new NextRequest(`https://dive.example.com/auth/confirm?${query}`)

beforeEach(() => supabase.reset())

describe('GET /auth/confirm', () => {
  it('exchanges a PKCE code for a session and continues to `next`', async () => {
    await expect(GET(request('code=abc&next=/auth/onboarding'))).rejects.toThrow('NEXT_REDIRECT:/auth/onboarding')
    expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('abc')
    expect(supabase.auth.verifyOtp).not.toHaveBeenCalled()
  })

  it('verifies a token hash link', async () => {
    await expect(GET(request('token_hash=h1&type=email'))).rejects.toThrow('NEXT_REDIRECT:/dashboard')
    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({ type: 'email', token_hash: 'h1' })
  })

  it('defaults `next` to the dashboard', async () => {
    await expect(GET(request('code=abc'))).rejects.toThrow('NEXT_REDIRECT:/dashboard')
  })

  it('sends the user to the error page when the code is invalid', async () => {
    supabase.auth.exchangeCodeForSession.mockResolvedValueOnce({ data: {}, error: { message: 'expired' } })
    await expect(GET(request('code=abc'))).rejects.toThrow('NEXT_REDIRECT:/error')
  })

  it('sends the user to the error page when the link has no code or token', async () => {
    await expect(GET(request(''))).rejects.toThrow('NEXT_REDIRECT:/error')
  })

  // Known bug: `next` comes straight from the query string, so a crafted
  // confirmation link can bounce a freshly signed-in user to any site.
  it.fails('only redirects to paths on this site', async () => {
    await expect(GET(request('code=abc&next=https://evil.example.com'))).rejects.toThrow('NEXT_REDIRECT:/dashboard')
  })
})
