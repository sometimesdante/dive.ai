'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function updateProfile(formData: FormData) {
  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const name    = (formData.get('name')    as string)?.trim() || null
  const phone   = (formData.get('phone')   as string)?.trim() || null
  const address = (formData.get('address') as string)?.trim() || null

  const { error } = await supabase
    .from('profiles')
    .update({ name, phone, address })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/profile')
  return { success: true }
}
