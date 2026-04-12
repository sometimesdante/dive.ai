'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'

export async function createOrgAndCluster(formData: FormData) {
  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const orgName = (formData.get('org_name') as string)?.trim()
  const clusterName = (formData.get('cluster_name') as string)?.trim()

  if (!orgName) return { error: 'Organization name is required' }
  if (!clusterName) return { error: 'Cluster name is required' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (profile?.org_id) return { error: 'You are already part of an organisation' }

  const service = createServiceClient()

  const { data: org, error: orgError } = await service
    .from('organizations')
    .insert({ name: orgName })
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

  const { error: clusterError } = await service
    .from('clusters')
    .insert({ org_id: org.id, name: clusterName })

  if (clusterError) return { error: clusterError.message }

  return { success: true }
}

export async function onboardingInviteUsers(emails: string[]) {
  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) return { error: 'No organisation found' }

  const errors: string[] = []

  for (const email of emails) {
    const { error } = await supabase
      .from('org_invites')
      .insert({ org_id: profile.org_id, email: email.toLowerCase(), invited_by: user.id })

    if (error) errors.push(`${email}: ${error.message}`)
  }

  if (errors.length > 0) return { error: errors.join(', ') }
  return { success: true }
}