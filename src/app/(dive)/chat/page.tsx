import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import Chat from '@/ui/dive/Chat'

export const dynamic = 'force-dynamic'

export default async function ChatPage() {
  const supabase = createClient(await cookies())

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user!.id)
    .single()

  const orgId = profile?.org_id

  const [{ data: clusters }, { data: projects }] = await Promise.all([
    orgId
      ? supabase.from('clusters').select('id, name').eq('org_id', orgId).order('name')
      : Promise.resolve({ data: [] }),
    orgId
      ? supabase.from('projects').select('id, name, code, cluster_id').eq('org_id', orgId).eq('is_archived', false).order('name')
      : Promise.resolve({ data: [] }),
  ])

  return (
    <Chat
      clusters={clusters ?? []}
      projects={projects ?? []}
      currentUserId={user!.id}
    />
  )
}
