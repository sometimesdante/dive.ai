import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import OrgSettings from '@/ui/dive/OrgSettings'

export default async function SettingsPage() {
  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, org_id, role, name, email')
    .eq('id', user!.id)
    .single()

  if (!profile?.org_id) {
    return <OrgSettings profile={profile} org={null} clusters={[]} members={[]} invites={[]} />
  }

  const [
    { data: org },
    { data: clusters },
    { data: members },
    { data: invites },
  ] = await Promise.all([
    supabase.from('organizations').select('id, name').eq('id', profile.org_id).single(),
    supabase.from('clusters').select('id, name, created_at').eq('org_id', profile.org_id).order('created_at'),
    supabase.from('profiles').select('id, name, email, role').eq('org_id', profile.org_id).order('name'),
    supabase.from('org_invites').select('id, email, token, created_at').eq('org_id', profile.org_id).is('accepted_at', null).order('created_at'),
  ])

  return (
    <OrgSettings
      profile={profile}
      org={org ?? null}
      clusters={clusters ?? []}
      members={members ?? []}
      invites={invites ?? []}
    />
  )
}
