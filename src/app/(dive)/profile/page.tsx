import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import ProfileSettings from '@/ui/dive/ProfileSettings'

export default async function ProfilePage() {
  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, email, phone, address')
    .eq('id', user!.id)
    .single()

  return <ProfileSettings profile={profile} />
}
