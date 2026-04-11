import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import AcceptInviteForm from './AcceptInviteForm'
import LogoutAndReturn from './LogoutAndReturn'

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; confirm?: string }>
}) {
  const { token, confirm } = await searchParams

  if (!token) redirect('/')

  const service = createServiceClient()
  const { data: invite } = await service
    .from('org_invites')
    .select('id, email, accepted_at, org_id, organizations(name)')
    .eq('token', token)
    .single()

  if (!invite) {
    return <Card title="Invalid invite" body="This invite link is invalid or has expired." />
  }

  if (invite.accepted_at) {
    return <Card title="Already used" body="This invite has already been accepted." />
  }

  const orgName = (invite.organizations as any)?.name ?? 'an organisation'

  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await service
      .from('profiles')
      .select('org_id, email')
      .eq('id', user.id)
      .single()

    const userEmail     = user.email ?? profile?.email ?? ''
    const emailMatches  = userEmail.toLowerCase() === invite.email.toLowerCase()
    const currentOrgId  = profile?.org_id ?? null

    // Already in the invited org — nothing to do
    if (currentOrgId === invite.org_id) {
      redirect('/dashboard')
    }

    // Wrong account — prompt to log out
    if (!emailMatches) {
      return (
        <div className="default-height flex items-center justify-center py-12">
          <div className="bg-[#f2f2f2] border border-[#e8e8e8] flex flex-col gap-4 p-6 w-[420px]">
            <h2>Wrong account</h2>
            <p className="text-sm text-[#242424]">
              You&apos;re signed in as <strong>{userEmail}</strong>, but this invite is for{' '}
              <strong>{invite.email}</strong>.
            </p>
            <p className="text-sm text-[#242424]">
              Log out and sign in with the correct account, then open the invite link again.
            </p>
            <LogoutAndReturn />
          </div>
        </div>
      )
    }

    // Correct email but already in a different org — require confirmation
    if (currentOrgId && currentOrgId !== invite.org_id && confirm !== '1') {
      const { data: currentOrg } = await service
        .from('organizations')
        .select('name')
        .eq('id', currentOrgId)
        .single()
      const currentOrgName = currentOrg?.name ?? 'your current organisation'

      return (
        <div className="default-height flex items-center justify-center py-12">
          <div className="bg-[#f2f2f2] border border-[#e8e8e8] flex flex-col gap-4 p-6 w-[420px]">
            <h2>Switch organisation?</h2>
            <p className="text-sm text-[#242424]">
              You&apos;re already a member of <strong>{currentOrgName}</strong>. Accepting this
              invite will remove you from that organisation and add you to{' '}
              <strong>{orgName}</strong>.
            </p>
            <div className="flex gap-2">
              <a
                href={`/auth/accept-invite?token=${token}&confirm=1`}
                className="flex-1 flex items-center justify-center bg-[#242424] h-8 rounded text-[#d3d3d3] text-sm cursor-pointer"
              >
                Accept anyway
              </a>
              <Link
                href="/dashboard"
                className="flex-1 flex items-center justify-center bg-[#f2f2f2] border border-[#838383] h-8 rounded text-[#242424] text-sm"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      )
    }

    // All clear — hand off to the route handler which can safely mutate
    redirect(`/api/accept-invite?token=${token}`)
  }

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

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="default-height flex items-center justify-center">
      <div className="bg-[#f2f2f2] border border-[#e8e8e8] flex flex-col gap-4 p-6 w-[420px]">
        <h2>{title}</h2>
        <p>{body}</p>
      </div>
    </div>
  )
}
