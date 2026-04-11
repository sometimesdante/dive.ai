import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) redirect('/')

  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in — send back to the invite page to sign in
  if (!user) redirect(`/auth/accept-invite?token=${token}`)

  const service = createServiceClient()

  const { data: invite } = await service
    .from('org_invites')
    .select('id, org_id, email, accepted_at')
    .eq('token', token)
    .single()

  // Invalid or already used — let the page render the appropriate message
  if (!invite || invite.accepted_at) redirect(`/auth/accept-invite?token=${token}`)

  await service.from('profiles').update({ org_id: invite.org_id }).eq('id', user.id)
  await service.from('org_invites').update({ accepted_at: new Date().toISOString() }).eq('id', invite.id)

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
