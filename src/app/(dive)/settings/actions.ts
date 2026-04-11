'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'

export async function createOrganization(formData: FormData) {
  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Organisation name is required' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (profile?.org_id) return { error: 'You are already part of an organisation' }

  // Use service client for writes — auth is already validated above.
  const service = createServiceClient()

  const { data: org, error: orgError } = await service
    .from('organizations')
    .insert({ name })
    .select('id')
    .single()

  if (orgError) return { error: orgError.message }

  const { error: profileError } = await service
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name ?? null,
      org_id: org.id,
      role: 'admin',
    })

  if (profileError) return { error: profileError.message }

  revalidatePath('/settings')
}

export async function renameOrganization(formData: FormData) {
  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) return { error: 'No organisation found' }
  if (profile.role !== 'admin') return { error: 'Only admins can rename the organisation' }

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Name is required' }

  const { error } = await supabase
    .from('organizations')
    .update({ name })
    .eq('id', profile.org_id)

  if (error) return { error: error.message }

  revalidatePath('/settings')
}

export async function createCluster(formData: FormData) {
  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) return { error: 'No organisation found' }

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Cluster name is required' }

  const { error } = await supabase
    .from('clusters')
    .insert({ org_id: profile.org_id, name })

  if (error) return { error: error.message }

  revalidatePath('/settings')
}

export async function deleteCluster(clusterId: string) {
  const supabase = createClient(await cookies())

  const { error } = await supabase
    .from('clusters')
    .delete()
    .eq('id', clusterId)

  if (error) return { error: error.message }

  revalidatePath('/settings')
}

export async function inviteUser(formData: FormData) {
  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) return { error: 'No organisation found' }

  const email = (formData.get('email') as string)?.trim().toLowerCase()
  if (!email) return { error: 'Email is required' }

  const { error } = await supabase
    .from('org_invites')
    .insert({ org_id: profile.org_id, email, invited_by: user.id })

  if (error) return { error: error.message }

  revalidatePath('/settings')
}

export async function revokeInvite(inviteId: string) {
  const supabase = createClient(await cookies())

  const { error } = await supabase
    .from('org_invites')
    .delete()
    .eq('id', inviteId)

  if (error) return { error: error.message }

  revalidatePath('/settings')
}
