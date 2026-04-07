import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import { acceptInvite } from '../actions'
import AcceptInviteForm from './AcceptInviteForm'

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) redirect('/')

  const service = createServiceClient()
  const { data: invite } = await service
    .from('org_invites')
    .select('email, accepted_at, organizations(name)')
    .eq('token', token)
    .single()

  if (!invite) {
    return (
      <div className="default-height flex items-center justify-center">
        <div className="bg-[#f2f2f2] border border-[#e8e8e8] flex flex-col gap-4 p-6 w-[420px]">
          <h2>Invalid invite</h2>
          <p>This invite link is invalid or has expired.</p>
        </div>
      </div>
    )
  }

  if (invite.accepted_at) {
    return (
      <div className="default-height flex items-center justify-center">
        <div className="bg-[#f2f2f2] border border-[#e8e8e8] flex flex-col gap-4 p-6 w-[420px]">
          <h2>Already used</h2>
          <p>This invite has already been accepted.</p>
        </div>
      </div>
    )
  }

  // If already logged in, accept immediately
  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    await acceptInvite(token)
  }

  const orgName = (invite.organizations as any)?.name ?? 'an organisation'

  return (
    <div className="default-height flex items-center justify-center py-12">
      <div className="bg-[#f2f2f2] border border-[#e8e8e8] flex flex-col gap-4 p-6 w-[420px]">
        <p>You&apos;ve been invited to join</p>
        <h2>{orgName}</h2>
        <AcceptInviteForm token={token} inviteEmail={invite.email} />
      </div>
    </div>
  )
}
