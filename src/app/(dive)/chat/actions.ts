'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

type Attachment = {
  url:  string
  name: string
  type: string
  size: number
}

export async function sendMessage(
  projectId:   string,
  content:     string,
  attachment?: Attachment | null,
) {
  const supabase = createClient(await cookies())

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('messages').insert({
    project_id:      projectId,
    sender_id:       user.id,
    content,
    attachment_url:  attachment?.url  ?? null,
    attachment_name: attachment?.name ?? null,
    attachment_type: attachment?.type ?? null,
    attachment_size: attachment?.size ?? null,
  })

  if (error) return { error: error.message }
}
